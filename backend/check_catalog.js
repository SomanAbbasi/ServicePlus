const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const categories = await prisma.serviceCategory.findMany({ orderBy: { sortOrder: 'asc' } });
  const summary = categories.map(c => ({
    id: c.id,
    name: c.name,
    nameAr: c.nameAr,
    slug: c.slug,
    imageUrl: c.imageUrl,
    icon: c.icon,
    description: c.description,
    descriptionAr: c.descriptionAr,
    isActive: c.isActive,
    sortOrder: c.sortOrder,
  }));
  console.log('REAL_CATEGORIES_SUMMARY:', JSON.stringify(summary, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());


