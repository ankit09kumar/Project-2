import { Router, Response } from 'express';
import Stripe from 'stripe';
import prisma from '../db';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key';

let stripeClient: Stripe | null = null;
if (stripeKey && stripeKey !== 'sk_test_mock_key') {
  try {
    stripeClient = new Stripe(stripeKey, { apiVersion: '2024-04-16' as any });
  } catch (err) {
    console.warn('Failed to initialize Stripe client. Falling back to simulation.');
  }
}

// Deposit via Stripe (or Simulation)
router.post('/deposit', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, simulate } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Valid deposit amount required' });
    }

    const userId = req.user!.id;

    // Simulate mode (no Stripe key or user wants instant simulation)
    if (!stripeClient || simulate === true) {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { balance: { increment: Number(amount) } }
      });
      return res.json({
        message: 'Deposit successful (Simulated)',
        clientSecret: 'mock_secret_123',
        newBalance: updatedUser.balance
      });
    }

    // Actual Stripe Payment Intent Creation
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: Math.round(amount * 100), // in cents
      currency: 'usd',
      metadata: { userId: String(userId) }
    });

    return res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error: any) {
    console.error('Payment deposit error:', error);
    return res.status(500).json({ error: error.message || 'Server error processing payment' });
  }
});

// Confirm deposit (useful for frontend simulated callbacks)
router.post('/confirm-deposit', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount } = req.body;
    const userId = req.user!.id;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { balance: { increment: Number(amount) } }
    });

    await prisma.notification.create({
      data: {
        userId,
        content: `Your account has been credited with $${amount} successfully.`,
        type: 'MILESTONE_PAID'
      }
    });

    return res.json({
      message: 'Deposit confirmed',
      newBalance: updatedUser.balance
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error confirming deposit' });
  }
});

// Payout (Withdraw)
router.post('/payout', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Valid payout amount required' });
    }

    const userId = req.user!.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient funds for payout' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { balance: { decrement: Number(amount) } }
    });

    await prisma.notification.create({
      data: {
        userId,
        content: `Payout of $${amount} processed. Funds will reach your bank account shortly.`,
        type: 'MILESTONE_PAID'
      }
    });

    return res.json({
      message: 'Payout successful',
      newBalance: updatedUser.balance
    });
  } catch (error) {
    console.error('Payout error:', error);
    return res.status(500).json({ error: 'Server error processing payout' });
  }
});

export default router;
