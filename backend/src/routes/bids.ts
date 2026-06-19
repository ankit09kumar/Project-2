import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateJWT, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// Place a Bid (Freelancer only)
router.post('/', authenticateJWT, requireRole(['FREELANCER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId, amount, proposal, deliveryTime } = req.body;

    if (!projectId || !amount || !proposal || !deliveryTime) {
      return res.status(400).json({ error: 'Missing required bid details' });
    }

    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.status !== 'OPEN') {
      return res.status(400).json({ error: 'Project is no longer open for bidding' });
    }

    // Check if freelancer already placed a bid
    const existingBid = await prisma.bid.findFirst({
      where: {
        projectId: Number(projectId),
        freelancerId: req.user!.id
      }
    });

    let bid;
    if (existingBid) {
      // Update bid
      bid = await prisma.bid.update({
        where: { id: existingBid.id },
        data: {
          amount: Number(amount),
          proposal,
          deliveryTime: Number(deliveryTime),
          status: 'PENDING'
        }
      });
    } else {
      // Create bid
      bid = await prisma.bid.create({
        data: {
          projectId: Number(projectId),
          freelancerId: req.user!.id,
          amount: Number(amount),
          proposal,
          deliveryTime: Number(deliveryTime),
          status: 'PENDING'
        }
      });
    }

    // Create notification for client
    await prisma.notification.create({
      data: {
        userId: project.clientId,
        content: `Freelancer ${req.user!.name} placed a bid of $${amount} on your project "${project.title}"`,
        type: 'BID_RECEIVED'
      }
    });

    return res.status(201).json(bid);
  } catch (error) {
    console.error('Bidding error:', error);
    return res.status(500).json({ error: 'Server error placing bid' });
  }
});

// Accept a Bid (Client only)
router.post('/:id/accept', authenticateJWT, requireRole(['CLIENT']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bidId = parseInt(req.params.id);
    if (isNaN(bidId)) {
      return res.status(400).json({ error: 'Invalid bid ID' });
    }

    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        project: true
      }
    });

    if (!bid) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    if (bid.project.clientId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized. You do not own this project.' });
    }

    if (bid.project.status !== 'OPEN') {
      return res.status(400).json({ error: 'Project is already in progress or closed' });
    }

    // Transaction to update bid, reject other bids, update project, and create contract
    const result = await prisma.$transaction(async (tx) => {
      // 1. Accept this bid
      const acceptedBid = await tx.bid.update({
        where: { id: bidId },
        data: { status: 'ACCEPTED' }
      });

      // 2. Reject other bids
      await tx.bid.updateMany({
        where: {
          projectId: bid.projectId,
          id: { not: bidId }
        },
        data: { status: 'REJECTED' }
      });

      // 3. Update project status and link freelancer
      const updatedProject = await tx.project.update({
        where: { id: bid.projectId },
        data: {
          status: 'IN_PROGRESS',
          freelancerId: bid.freelancerId
        }
      });

      // 4. Create Contract
      const contract = await tx.contract.create({
        data: {
          projectId: bid.projectId,
          clientId: req.user!.id,
          freelancerId: bid.freelancerId,
          totalAmount: bid.amount,
          escrowBalance: 0.0, // Funded by client later
          status: 'ACTIVE'
        }
      });

      // 5. Create default milestones (e.g. Milestone 1: Deliverable 100%)
      await tx.milestone.create({
        data: {
          contractId: contract.id,
          title: 'Project Completion Deliverable',
          amount: bid.amount,
          status: 'PENDING'
        }
      });

      return { acceptedBid, updatedProject, contract };
    });

    // Notify Freelancer
    await prisma.notification.create({
      data: {
        userId: bid.freelancerId,
        content: `Your bid on "${bid.project.title}" has been accepted! A contract has been created.`,
        type: 'BID_ACCEPTED'
      }
    });

    return res.json(result);
  } catch (error) {
    console.error('Accept bid error:', error);
    return res.status(500).json({ error: 'Server error accepting bid' });
  }
});

// Reject a Bid (Client only)
router.post('/:id/reject', authenticateJWT, requireRole(['CLIENT']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bidId = parseInt(req.params.id);
    if (isNaN(bidId)) {
      return res.status(400).json({ error: 'Invalid bid ID' });
    }

    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: { project: true }
    });

    if (!bid) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    if (bid.project.clientId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const updatedBid = await prisma.bid.update({
      where: { id: bidId },
      data: { status: 'REJECTED' }
    });

    return res.json(updatedBid);
  } catch (error) {
    console.error('Reject bid error:', error);
    return res.status(500).json({ error: 'Server error rejecting bid' });
  }
});

export default router;
