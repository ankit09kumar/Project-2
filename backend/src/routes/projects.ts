import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateJWT, AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// Create Project (Client only)
router.post('/', authenticateJWT, requireRole(['CLIENT']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, budgetType, budgetMin, budgetMax } = req.body;

    if (!title || !description || !budgetType || budgetMin === undefined || budgetMax === undefined) {
      return res.status(400).json({ error: 'Missing required project fields' });
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        budgetType,
        budgetMin: Number(budgetMin),
        budgetMax: Number(budgetMax),
        clientId: req.user!.id,
        status: 'OPEN'
      }
    });

    return res.status(201).json(project);
  } catch (error) {
    console.error('Project creation error:', error);
    return res.status(500).json({ error: 'Server error creating project' });
  }
});

// Browse Projects
router.get('/', async (req, res) => {
  try {
    const { search, skills, budgetMin, budgetMax, status } = req.query;

    const filterConditions: any = {};

    // Filter by status
    if (status) {
      filterConditions.status = status as any;
    } else {
      filterConditions.status = 'OPEN';
    }

    // Filter by text search
    if (search) {
      filterConditions.OR = [
        { title: { contains: search as string } },
        { description: { contains: search as string } }
      ];
    }

    // Filter by budget
    if (budgetMin) {
      filterConditions.budgetMax = { gte: Number(budgetMin) };
    }
    if (budgetMax) {
      filterConditions.budgetMin = { lte: Number(budgetMax) };
    }

    // Fetch projects
    const projects = await prisma.project.findMany({
      where: filterConditions,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            rating: true
          }
        },
        _count: {
          select: { bids: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // If filter by skills tag in query
    let filteredProjects = projects;
    if (skills) {
      const skillsList = (skills as string).split(',').map(s => s.trim().toLowerCase());
      // Prisma arrays don't easily do intersection queries unless using raw, so we can filter in memory or client side,
      // which is fine for this size, or match if user details match. Since skills are stored on the User,
      // if we want to filter by project required skills: wait, Project does not have required skills stored in schema.
      // Wait, let's look at schema: Project doesn't have skills stored. Oh, let's verify if we need to add skills to Project model,
      // or if we just search description/title. Let's see: searching description/title or matching user skills.
      // We can search for the skills words in the title or description of the project.
      filteredProjects = projects.filter(project => {
        const text = (project.title + ' ' + project.description).toLowerCase();
        return skillsList.every(skill => text.includes(skill));
      });
    }

    return res.json(filteredProjects);
  } catch (error) {
    console.error('Fetch projects error:', error);
    return res.status(500).json({ error: 'Server error fetching projects' });
  }
});

// Get single project
router.get('/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            rating: true,
            bio: true
          }
        },
        bids: {
          include: {
            freelancer: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                rating: true,
                skills: true
              }
            }
          },
          orderBy: { amount: 'asc' }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const parsedBids = project.bids.map(bid => ({
      ...bid,
      freelancer: {
        ...bid.freelancer,
        skills: bid.freelancer.skills ? bid.freelancer.skills.split(',').map(s => s.trim()).filter(Boolean) : []
      }
    }));

    return res.json({
      ...project,
      bids: parsedBids
    });
  } catch (error) {
    console.error('Fetch project details error:', error);
    return res.status(500).json({ error: 'Server error fetching project details' });
  }
});

// Delete Project (Client only)
router.delete('/:id', authenticateJWT, requireRole(['CLIENT']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.clientId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized. You do not own this project.' });
    }

    await prisma.project.delete({
      where: { id: projectId }
    });

    return res.json({ message: 'Project successfully deleted' });
  } catch (error) {
    console.error('Delete project error:', error);
    return res.status(500).json({ error: 'Server error deleting project' });
  }
});

export default router;
