import { PrismaClient } from '@prisma/client';
async function main() {
  const p = new PrismaClient();

  const duplicate = await p.profile.findFirst({
    where: { phone: '+923079035614' },
    include: { userRoles: true },
  });

  if (duplicate) {
    console.log(`Deleting duplicate profile: ${duplicate.phone} (id=${duplicate.id}) with roles: ${duplicate.userRoles.map(r => r.role).join(', ')}`);
    await p.userRole.deleteMany({ where: { userId: duplicate.id } });
    await p.profile.delete({ where: { id: duplicate.id } });
    console.log('Deleted.');
  }

  const admin = await p.profile.findFirst({
    where: { phone: '+03079035614' },
    include: { userRoles: true },
  });

  if (admin) {
    console.log(`Admin profile: ${admin.phone} (id=${admin.id}) with roles: ${admin.userRoles.map(r => r.role).join(', ')}`);
  }

  await p.$disconnect();
}
main();
