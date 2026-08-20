import { PrismaClient } from '@prisma/client';
async function main() {
  const p = new PrismaClient();
  const profiles = await p.profile.findMany({ select: { id: true, phone: true, fullName: true } });
  console.log('All profiles:');
  profiles.forEach((p) => console.log(`  id=${p.id} phone=${p.phone} name=${p.fullName}`));
  const roles = await p.userRole.findMany({ select: { userId: true, role: true } });
  console.log('All roles:');
  roles.forEach((r) => console.log(`  userId=${r.userId} role=${r.role}`));
  await p.$disconnect();
}
main();
