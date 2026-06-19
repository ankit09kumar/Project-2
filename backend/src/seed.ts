import bcrypt from 'bcrypt';
import prisma from './db';

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (optional, but good for clean seed)
  await prisma.message.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.dispute.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.milestone.deleteMany({});
  await prisma.contract.deleteMany({});
  await prisma.bid.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  // Hash passwords
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'Admin Lumina',
      email: 'admin@luminawork.com',
      passwordHash,
      role: 'ADMIN',
      bio: 'Platform Administrator',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin'
    }
  });

  const client = await prisma.user.create({
    data: {
      name: 'Jane Client',
      email: 'client@luminawork.com',
      passwordHash,
      role: 'CLIENT',
      bio: 'Product Manager looking for frontend developers.',
      balance: 10000.0,
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=jane'
    }
  });

  const freelancer = await prisma.user.create({
    data: {
      name: 'Alex Freelancer',
      email: 'freelancer@luminawork.com',
      passwordHash,
      role: 'FREELANCER',
      bio: 'Fullstack developer specialized in React, Node, and TypeScript.',
      skills: 'React,TypeScript,Node.js,Tailwind CSS,GraphQL' as any,
      balance: 500.0,
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=alex'
    }
  });

  const freelancer2 = await prisma.user.create({
    data: {
      name: 'Bob Designer',
      email: 'designer@luminawork.com',
      passwordHash,
      role: 'FREELANCER',
      bio: 'UI/UX Designer creating pixel perfect designs.',
      skills: 'Figma,UI/UX,Tailwind CSS,Logo Design' as any,
      balance: 200.0,
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=bob'
    }
  });

  console.log('✅ Users seeded');

  // 2. Create Projects
  const project1 = await prisma.project.create({
    data: {
      title: 'E-commerce React Dashboard',
      description: 'We need a gorgeous glassmorphic React dashboard with Tailwind CSS. It must include charts, transaction details, and dark mode support.',
      budgetType: 'FIXED',
      budgetMin: 800,
      budgetMax: 1500,
      clientId: client.id,
      status: 'OPEN'
    }
  });

  const project2 = await prisma.project.create({
    data: {
      title: 'REST API Optimization (Node/Express)',
      description: 'Optimize existing Express server database queries. Improve load times by adding Redis caching and optimizing prisma select queries.',
      budgetType: 'HOURLY',
      budgetMin: 40,
      budgetMax: 80,
      clientId: client.id,
      status: 'OPEN'
    }
  });

  console.log('✅ Projects seeded');

  // 3. Create Bids
  await prisma.bid.create({
    data: {
      amount: 1200,
      proposal: 'I have 4 years of experience with React and Tailwind. I can build this glassmorphic dashboard in 5 days with pixel-perfect responsive layouts.',
      deliveryTime: 5,
      projectId: project1.id,
      freelancerId: freelancer.id,
      status: 'PENDING'
    }
  });

  await prisma.bid.create({
    data: {
      amount: 950,
      proposal: 'Hey Jane, I can design a clean dashboard in Figma and translate it into a stunning frontend app. Let me know if you want to chat!',
      deliveryTime: 7,
      projectId: project1.id,
      freelancerId: freelancer2.id,
      status: 'PENDING'
    }
  });

  console.log('✅ Bids seeded');

  // 4. Create Notification
  await prisma.notification.create({
    data: {
      userId: client.id,
      content: 'Alex Freelancer placed a bid of $1200 on your dashboard project.',
      type: 'BID_RECEIVED'
    }
  });

  console.log('🌱 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
