import { PrismaClient } from '@prisma/client';

async function main() {
  const p = new PrismaClient();

  const updates = [
    { slug: 'deep-cleaning', url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80' },
    { slug: 'regular-cleaning', url: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=600&q=80' },
    { slug: 'furniture-assembly', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80' },
    { slug: 'plumbing-repair', url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&q=80' },
    { slug: 'electrical-repair', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80' },
    { slug: 'sofa-cleaning', url: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&q=80' },
  ];

  for (const u of updates) {
    const r = await p.service.updateMany({ where: { slug: u.slug }, data: { imageUrl: u.url } });
    console.log(`  ${u.slug}: ${r.count} row(s) updated`);
  }

  await p.$disconnect();
  console.log('Done');
}

main();
