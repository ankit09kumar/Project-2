import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get list of users with chat history (Conversations list)
router.get('/conversations', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Find all messages involving the current user
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group messages by the other user ID
    const conversationMap = new Map<number, { lastMessage: string; timestamp: Date; unread: boolean }>();
    for (const msg of messages) {
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!conversationMap.has(otherId)) {
        conversationMap.set(otherId, {
          lastMessage: msg.content,
          timestamp: msg.createdAt,
          unread: !msg.read && msg.receiverId === userId
        });
      }
    }

    const otherUserIds = Array.from(conversationMap.keys());

    // Fetch user details for these conversation partners
    const users = await prisma.user.findMany({
      where: {
        id: { in: otherUserIds }
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true
      }
    });

    const conversations = users.map(user => {
      const info = conversationMap.get(user.id)!;
      return {
        user,
        lastMessage: info.lastMessage,
        timestamp: info.timestamp,
        unread: info.unread
      };
    });

    // Sort by most recent message
    conversations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return res.json(conversations);
  } catch (error) {
    console.error('Fetch conversations error:', error);
    return res.status(500).json({ error: 'Server error fetching conversations' });
  }
});

// Get message history between current user and another user
router.get('/history/:otherUserId', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const otherUserId = parseInt(req.params.otherUserId);

    if (isNaN(otherUserId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Mark incoming messages as read
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        read: false
      },
      data: {
        read: true
      }
    });

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    return res.json(messages);
  } catch (error) {
    console.error('Fetch chat history error:', error);
    return res.status(500).json({ error: 'Server error fetching chat history' });
  }
});

// Search potential users to message (returns freelancers/clients)
router.get('/search', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user!.id;

    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        name: { contains: (query as string) || '' }
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        role: true
      },
      take: 10
    });

    return res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    return res.status(500).json({ error: 'Server error searching users' });
  }
});

export default router;
