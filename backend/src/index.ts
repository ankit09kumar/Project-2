import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import bidRoutes from './routes/bids';
import contractRoutes from './routes/contracts';
import paymentRoutes from './routes/payments';
import chatRoutes from './routes/chat';
import adminRoutes from './routes/admin';
import prisma from './db';
import { authenticateJWT, AuthenticatedRequest } from './middleware/auth';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

// General Notification Endpoints
app.get('/api/notifications', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 25
    });
    return res.json(notifications);
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return res.status(500).json({ error: 'Server error loading notifications' });
  }
});

app.put('/api/notifications/:id/read', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const notifId = parseInt(req.params.id);
    if (isNaN(notifId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    const updated = await prisma.notification.update({
      where: { id: notifId, userId: req.user!.id },
      data: { read: true }
    });
    return res.json(updated);
  } catch (error) {
    console.error('Notification mark read error:', error);
    return res.status(500).json({ error: 'Server error updating notification' });
  }
});

// Root check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'luminawork-backend' });
});

// Setup Servers
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Active sockets tracking map: userId -> socketId
const onlineUsers = new Map<number, string>();

// Socket.io JWT Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication failed: missing token'));
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'luminawork_super_secret_jwt_key_123!';
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    socket.data.user = decoded;
    next();
  } catch (err) {
    return next(new Error('Authentication failed: invalid token'));
  }
});

io.on('connection', (socket) => {
  const user = socket.data.user;
  onlineUsers.set(user.id, socket.id);
  console.log(`🟢 Socket connected: ${user.name} (ID: ${user.id})`);

  // Handle live chat messaging
  socket.on('send_message', async (data: { receiverId: number; content: string }) => {
    try {
      const { receiverId, content } = data;
      if (!receiverId || !content.trim()) return;

      // Save message to database
      const msg = await prisma.message.create({
        data: {
          senderId: user.id,
          receiverId,
          content,
          read: false
        }
      });

      // Emit to receiver if online
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_message', msg);
      }

      // Confirm send status back to sender
      socket.emit('message_sent', msg);
    } catch (err) {
      console.error('Socket message save error:', err);
    }
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(user.id);
    console.log(`🔴 Socket disconnected: ${user.name} (ID: ${user.id})`);
  });
});

server.listen(port, () => {
  console.log(`🚀 LuminaWork Backend listening on port ${port}`);
});
