import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateJWT, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// Apply ADMIN restriction to all routes in this router
router.use(authenticateJWT, requireRole(['ADMIN']));

// Get platform analytics
router.get('/analytics', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalProjects = await prisma.project.count();
    const totalContracts = await prisma.contract.count();
    const totalDisputes = await prisma.dispute.count();

    const openDisputes = await prisma.dispute.count({ where: { status: 'OPEN' } });

    // Aggregate contract escrow & total volume
    const escrowSum = await prisma.contract.aggregate({
      _sum: { escrowBalance: true, totalAmount: true }
    });

    const activeContracts = await prisma.contract.count({ where: { status: 'ACTIVE' } });
    const completedContracts = await prisma.contract.count({ where: { status: 'COMPLETED' } });

    // Dummy data for charts
    const chartVolume = [
      { month: 'Jan', revenue: 12000, projects: 12 },
      { month: 'Feb', revenue: 19000, projects: 18 },
      { month: 'Mar', revenue: 32000, projects: 29 },
      { month: 'Apr', revenue: 45000, projects: 41 },
      { month: 'May', revenue: 64000, projects: 54 },
      { month: 'Jun', revenue: 85000, projects: 72 }
    ];

    return res.json({
      metrics: {
        totalUsers,
        totalProjects,
        totalContracts,
        totalDisputes,
        openDisputes,
        activeContracts,
        completedContracts,
        totalVolume: escrowSum._sum.totalAmount || 0,
        escrowBalance: escrowSum._sum.escrowBalance || 0
      },
      chartVolume
    });
  } catch (error) {
    console.error('Fetch analytics error:', error);
    return res.status(500).json({ error: 'Server error loading analytics' });
  }
});

// List all disputes
router.get('/disputes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const disputes = await prisma.dispute.findMany({
      include: {
        contract: {
          include: {
            project: { select: { title: true } },
            client: { select: { id: true, name: true, email: true } },
            freelancer: { select: { id: true, name: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(disputes);
  } catch (error) {
    console.error('Fetch disputes error:', error);
    return res.status(500).json({ error: 'Server error fetching disputes' });
  }
});

// Resolve Dispute
router.post('/disputes/:id/resolve', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const disputeId = parseInt(req.params.id);
    const { action } = req.body; // 'REFUND_CLIENT' or 'RELEASE_FREELANCER'

    if (isNaN(disputeId) || !['REFUND_CLIENT', 'RELEASE_FREELANCER'].includes(action)) {
      return res.status(400).json({ error: 'Invalid ID or resolve action' });
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { contract: true }
    });

    if (!dispute) {
      return res.status(404).json({ error: 'Dispute record not found' });
    }

    if (dispute.status !== 'OPEN') {
      return res.status(400).json({ error: 'Dispute is already resolved' });
    }

    const contract = dispute.contract;
    const escrowAmt = contract.escrowBalance;

    const result = await prisma.$transaction(async (tx) => {
      // Update dispute record
      const resolvedDispute = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: action === 'REFUND_CLIENT' ? 'RESOLVED_REFUNDED' : 'RESOLVED_RELEASED',
          resolvedAt: new Date()
        }
      });

      // Update contract status to COMPLETED (released/resolved)
      await tx.contract.update({
        where: { id: contract.id },
        data: {
          status: 'COMPLETED',
          escrowBalance: 0.0
        }
      });

      // Update project status to COMPLETED
      await tx.project.update({
        where: { id: contract.projectId },
        data: { status: 'COMPLETED' }
      });

      if (action === 'REFUND_CLIENT') {
        // Refund client
        await tx.user.update({
          where: { id: contract.clientId },
          data: { balance: { increment: escrowAmt } }
        });
      } else {
        // Release to freelancer
        await tx.user.update({
          where: { id: contract.freelancerId },
          data: { balance: { increment: escrowAmt } }
        });
      }

      return resolvedDispute;
    });

    // Notify parties
    await prisma.notification.create({
      data: {
        userId: contract.clientId,
        content: `Dispute on contract #${contract.id} resolved. Decision: ${action === 'REFUND_CLIENT' ? 'Refunded to Client' : 'Released to Freelancer'}.`,
        type: 'DISPUTE'
      }
    });

    await prisma.notification.create({
      data: {
        userId: contract.freelancerId,
        content: `Dispute on contract #${contract.id} resolved. Decision: ${action === 'REFUND_CLIENT' ? 'Refunded to Client' : 'Released to Freelancer'}.`,
        type: 'DISPUTE'
      }
    });

    return res.json(result);
  } catch (error) {
    console.error('Resolve dispute error:', error);
    return res.status(500).json({ error: 'Server error resolving dispute' });
  }
});

// List all users
router.get('/users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        rating: true,
        balance: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(users);
  } catch (error) {
    console.error('Admin users query error:', error);
    return res.status(500).json({ error: 'Server error loading users' });
  }
});

export default router;
