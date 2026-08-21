const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const categories = await prisma.serviceCategory.findMany();
  const services = await prisma.service.findMany();

  console.log('--- DATABASE CHECK ---');
  console.log('Total Categories in DB:', categories.length);
  console.log('Categories:', categories.map(c => ({ id: c.id, name: c.name, isActive: c.isActive })));
  console.log('Total Services in DB:', services.length);
  console.log('Active Services count:', services.filter(s => s.isActive).length);
}

check().catch(console.error).finally(() => prisma.$disconnect());
