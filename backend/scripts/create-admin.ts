import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const phone = '+03079035614';

  let profile = await prisma.profile.findFirst({ where: { phone } });

  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        phone,
        email: '03079035614@phone.serviceplus.app',
        fullName: 'Admin User',
      },
    });
    console.log('Created profile:', profile.id);
  } else {
    console.log('Profile already exists:', profile.id);
  }

  const existingRole = await prisma.userRole.findFirst({
    where: { userId: profile.id, role: 'admin' },
  });

  if (!existingRole) {
    await prisma.userRole.create({
      data: { userId: profile.id, role: 'admin' },
    });
    console.log('Admin role added');
  } else {
    console.log('Admin role already exists');
  }

  const user = await prisma.profile.findUnique({
    where: { id: profile.id },
    include: { userRoles: true },
  });
  console.log('User:', JSON.stringify(user, null, 2));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
