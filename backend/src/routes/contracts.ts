import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateJWT, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// Get list of contracts
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    const queryConditions: any = {};
    if (role === 'CLIENT') {
      queryConditions.clientId = userId;
    } else if (role === 'FREELANCER') {
      queryConditions.freelancerId = userId;
    } else {
      // Admin sees everything
    }

    const contracts = await prisma.contract.findMany({
      where: queryConditions,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        freelancer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        milestones: {
          orderBy: { id: 'asc' }
        },
        reviews: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(contracts);
  } catch (error) {
    console.error('Fetch contracts error:', error);
    return res.status(500).json({ error: 'Server error fetching contracts' });
  }
});

// Get single contract details
router.get('/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contractId = parseInt(req.params.id);
    if (isNaN(contractId)) {
      return res.status(400).json({ error: 'Invalid contract ID' });
    }

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        project: true,
        client: {
          select: { id: true, name: true, email: true, avatarUrl: true, balance: true }
        },
        freelancer: {
          select: { id: true, name: true, email: true, avatarUrl: true }
        },
        milestones: {
          orderBy: { id: 'asc' }
        },
        reviews: true,
        disputes: true
      }
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Authorization
    if (req.user!.role !== 'ADMIN' && contract.clientId !== req.user!.id && contract.freelancerId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return res.json(contract);
  } catch (error) {
    console.error('Fetch contract detail error:', error);
    return res.status(500).json({ error: 'Server error fetching contract detail' });
  }
});

// Fund milestone (Client only)
router.post('/milestones/:id/fund', authenticateJWT, requireRole(['CLIENT']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const milestoneId = parseInt(req.params.id);
    if (isNaN(milestoneId)) {
      return res.status(400).json({ error: 'Invalid milestone ID' });
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: { client: true }
        }
      }
    });

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    if (milestone.contract.clientId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized. You do not own this contract.' });
    }

    if (milestone.status !== 'PENDING') {
      return res.status(400).json({ error: 'Milestone is already funded or completed' });
    }

    const client = milestone.contract.client;
    if (client.balance < milestone.amount) {
      return res.status(400).json({ error: 'Insufficient wallet balance. Please add funds first.' });
    }

    // Run transaction: deduct client balance, increase contract escrow, mark milestone as funded (IN_ESCROW)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct client balance
      await tx.user.update({
        where: { id: client.id },
        data: { balance: { decrement: milestone.amount } }
      });

      // 2. Add to contract escrow
      await tx.contract.update({
        where: { id: milestone.contractId },
        data: { escrowBalance: { increment: milestone.amount } }
      });

      // 3. Update milestone status
      const updatedMilestone = await tx.milestone.update({
        where: { id: milestoneId },
        data: { status: 'IN_ESCROW' }
      });

      return updatedMilestone;
    });

    // Notify freelancer
    await prisma.notification.create({
      data: {
        userId: milestone.contract.freelancerId,
        content: `Milestone "${milestone.title}" has been funded. You can begin working!`,
        type: 'MILESTONE_PAID'
      }
    });

    return res.json(result);
  } catch (error) {
    console.error('Fund milestone error:', error);
    return res.status(500).json({ error: 'Server error funding milestone' });
  }
});

// Submit milestone work (Freelancer only)
router.post('/milestones/:id/submit', authenticateJWT, requireRole(['FREELANCER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const milestoneId = parseInt(req.params.id);
    const { workSubmission } = req.body;

    if (isNaN(milestoneId) || !workSubmission) {
      return res.status(400).json({ error: 'Invalid details or missing submission details' });
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: true
      }
    });

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    if (milestone.contract.freelancerId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    if (milestone.status !== 'IN_ESCROW') {
      return res.status(400).json({ error: 'Milestone must be funded in escrow before submitting work' });
    }

    const updatedMilestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'SUBMITTED',
        workSubmission
      }
    });

    // Notify client
    await prisma.notification.create({
      data: {
        userId: milestone.contract.clientId,
        content: `Freelancer submitted work for milestone "${milestone.title}". Please review it.`,
        type: 'MILESTONE_PAID' // Or SUBMITTED type
      }
    });

    return res.json(updatedMilestone);
  } catch (error) {
    console.error('Submit milestone work error:', error);
    return res.status(500).json({ error: 'Server error submitting work' });
  }
});

// Approve milestone work and release escrow (Client only)
router.post('/milestones/:id/approve', authenticateJWT, requireRole(['CLIENT']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const milestoneId = parseInt(req.params.id);
    if (isNaN(milestoneId)) {
      return res.status(400).json({ error: 'Invalid milestone ID' });
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: true
      }
    });

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    if (milestone.contract.clientId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    if (milestone.status !== 'SUBMITTED' && milestone.status !== 'IN_ESCROW') {
      return res.status(400).json({ error: 'Milestone cannot be approved at this stage' });
    }

    if (milestone.contract.escrowBalance < milestone.amount) {
      return res.status(400).json({ error: 'Insufficient contract escrow balance. Cannot release funds.' });
    }

    // Run transaction: release escrow to freelancer, update milestone status
    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct contract escrow balance
      await tx.contract.update({
        where: { id: milestone.contractId },
        data: { escrowBalance: { decrement: milestone.amount } }
      });

      // 2. Add to freelancer balance
      await tx.user.update({
        where: { id: milestone.contract.freelancerId },
        data: { balance: { increment: milestone.amount } }
      });

      // 3. Mark milestone as APPROVED
      const updated = await tx.milestone.update({
        where: { id: milestoneId },
        data: { status: 'APPROVED' }
      });

      return updated;
    });

    // Check if ALL milestones are now approved
    const allMilestones = await prisma.milestone.findMany({
      where: { contractId: milestone.contractId }
    });

    const allApproved = allMilestones.every(m => m.status === 'APPROVED');
    if (allApproved) {
      // Update contract to COMPLETED
      await prisma.contract.update({
        where: { id: milestone.contractId },
        data: { status: 'COMPLETED' }
      });

      // Update project to COMPLETED
      await prisma.project.update({
        where: { id: milestone.contract.projectId },
        data: { status: 'COMPLETED' }
      });
    }

    // Notify freelancer
    await prisma.notification.create({
      data: {
        userId: milestone.contract.freelancerId,
        content: `Client approved work and released $${milestone.amount} for milestone "${milestone.title}"`,
        type: 'MILESTONE_PAID'
      }
    });

    return res.json({ milestone: result, contractCompleted: allApproved });
  } catch (error) {
    console.error('Approve milestone error:', error);
    return res.status(500).json({ error: 'Server error approving milestone' });
  }
});

// File dispute (Client or Freelancer)
router.post('/:id/dispute', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contractId = parseInt(req.params.id);
    const { reason } = req.body;

    if (isNaN(contractId) || !reason) {
      return res.status(400).json({ error: 'Invalid contract ID or missing reason' });
    }

    const contract = await prisma.contract.findUnique({
      where: { id: contractId }
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    if (contract.clientId !== req.user!.id && contract.freelancerId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    if (contract.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Can only dispute active contracts' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create dispute record
      const dispute = await tx.dispute.create({
        data: {
          contractId,
          reason,
          status: 'OPEN'
        }
      });

      // 2. Update contract status to DISPUTED
      await tx.contract.update({
        where: { id: contractId },
        data: { status: 'DISPUTED' }
      });

      // 3. Update project status to DISPUTED
      await tx.project.update({
        where: { id: contract.projectId },
        data: { status: 'DISPUTED' }
      });

      return dispute;
    });

    // Notify admins & the other party
    const targetNotifyUser = req.user!.id === contract.clientId ? contract.freelancerId : contract.clientId;
    await prisma.notification.create({
      data: {
        userId: targetNotifyUser,
        content: `A dispute has been raised on your contract. Reason: ${reason}`,
        type: 'DISPUTE'
      }
    });

    return res.json(result);
  } catch (error) {
    console.error('Dispute filing error:', error);
    return res.status(500).json({ error: 'Server error filing dispute' });
  }
});

// Leave Review
router.post('/:id/reviews', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contractId = parseInt(req.params.id);
    const { rating, comment } = req.body;

    if (isNaN(contractId) || rating === undefined || !comment) {
      return res.status(400).json({ error: 'Rating and comment are required' });
    }

    const contract = await prisma.contract.findUnique({
      where: { id: contractId }
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    if (contract.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Reviews can only be left after contract completion' });
    }

    const reviewerId = req.user!.id;
    let revieweeId: number;

    if (reviewerId === contract.clientId) {
      revieweeId = contract.freelancerId;
    } else if (reviewerId === contract.freelancerId) {
      revieweeId = contract.clientId;
    } else {
      return res.status(403).json({ error: 'Unauthorized to leave review on this contract' });
    }

    // Check if user already reviewed
    const existingReview = await prisma.review.findFirst({
      where: { contractId, reviewerId }
    });

    if (existingReview) {
      return res.status(400).json({ error: 'You have already left a review for this contract' });
    }

    const review = await prisma.review.create({
      data: {
        contractId,
        reviewerId,
        revieweeId,
        rating: parseInt(rating),
        comment
      }
    });

    // Recalculate average rating of reviewee
    const allRatings = await prisma.review.aggregate({
      where: { revieweeId },
      _avg: { rating: true }
    });

    const averageRating = allRatings._avg.rating || 0;

    await prisma.user.update({
      where: { id: revieweeId },
      data: { rating: Number(averageRating.toFixed(1)) }
    });

    return res.json(review);
  } catch (error) {
    console.error('Review submit error:', error);
    return res.status(500).json({ error: 'Server error submitting review' });
  }
});

export default router;
