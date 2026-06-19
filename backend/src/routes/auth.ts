import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../db';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'luminawork_super_secret_jwt_key_123!';

// Helper to convert skills database string/array to array
const parseSkills = (skills: string | string[] | undefined | null): string[] => {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills.map(s => s.trim()).filter(Boolean);
  return skills.split(',').map(s => s.trim()).filter(Boolean);
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, name, bio, skills } = req.body;

    if (!email || !password || !role || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['CLIENT', 'FREELANCER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role selection' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const skillsString = Array.isArray(skills) ? skills.join(',') : (skills || '');

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        name,
        bio: bio || '',
        skills: skillsString as any,
        balance: role === 'CLIENT' ? 5000.0 : 0.0, // Default demo starting balance
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`
      }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        bio: user.bio,
        skills: parseSkills(user.skills),
        balance: user.balance,
        avatarUrl: user.avatarUrl,
        rating: user.rating
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        bio: user.bio,
        skills: parseSkills(user.skills),
        balance: user.balance,
        avatarUrl: user.avatarUrl,
        rating: user.rating
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

// Get profile
router.get('/profile', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        bio: user.bio,
        skills: parseSkills(user.skills),
        balance: user.balance,
        avatarUrl: user.avatarUrl,
        rating: user.rating
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ error: 'Server error fetching profile' });
  }
});

// Update profile
router.put('/profile', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, bio, skills, avatarUrl } = req.body;
    let skillsString: string | undefined = undefined;
    if (skills !== undefined) {
      skillsString = Array.isArray(skills) ? skills.join(',') : skills;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        name: name !== undefined ? name : undefined,
        bio: bio !== undefined ? bio : undefined,
        skills: (skillsString !== undefined ? skillsString : undefined) as any,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
      }
    });

    return res.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        name: updatedUser.name,
        bio: updatedUser.bio,
        skills: parseSkills(updatedUser.skills),
        balance: updatedUser.balance,
        avatarUrl: updatedUser.avatarUrl,
        rating: updatedUser.rating
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ error: 'Server error updating profile' });
  }
});

export default router;
