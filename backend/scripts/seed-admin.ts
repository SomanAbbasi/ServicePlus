import { PrismaClient } from '@prisma/client';

async function main() {
  const p = new PrismaClient();
  const phones = ['+03079035614'];

  for (const phone of phones) {
    let profile = await p.profile.findFirst({ where: { phone }, include: { userRoles: true } });

    if (!profile) {
      profile = await p.profile.create({
        data: {
          phone,
          email: `${phone.replace(/\D/g, '')}@phone.serviceplus.app`,
          fullName: 'Admin User',
          userRoles: { create: { role: 'admin' } },
        },
        include: { userRoles: true },
      });
      console.log(`Created profile + admin role for ${phone}`);
    } else {
      const hasAdmin = profile.userRoles.some((r) => r.role === 'admin');
      if (!hasAdmin) {
        await p.userRole.create({ data: { userId: profile.id, role: 'admin' } });
        console.log(`Added admin role to existing profile ${phone} (id=${profile.id})`);
      } else {
        console.log(`${phone} already has admin role (id=${profile.id})`);
      }
    }

    console.log('Roles:', profile.userRoles.map((r) => r.role));
  }

  await p.$disconnect();
}

main();
