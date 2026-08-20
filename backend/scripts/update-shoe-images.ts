import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const optionGroupImages: Record<string, string> = {
  'Shoe Cleaning': 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=80',
  'Combos': 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&q=80',
};

const variantImages: Record<string, string> = {
  'Kids Shoes (Up to 12 Yrs)': 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=400&q=80',
  'Sneakers': 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400&q=80',
  'Designer Sneakers': 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=400&q=80',
  'Minor Shoe Repair': 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80',
  'Major Shoe Repair': 'https://images.unsplash.com/photo-1582845512747-e42001c95638?w=400&q=80',
  'Formal Shoe Polishing': 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400&q=80',
  'Formal Shoes': 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=400&q=80',
  'Designer Formal Shoes': 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400&q=80',
  'Sandals': 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400&q=80',
  'Designer Sandals': 'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=400&q=80',
  'Espadrilles': 'https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?w=400&q=80',
  'Designer Espadrilles': 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&q=80',
  'Cleaning Bundle of 3 pairs': 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&q=80',
  'Designer Sneakers (3 Pairs)': 'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?w=400&q=80',
  'Sneakers (10 for the price of 8)': 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=400&q=80',
};

async function main() {
  console.log('🔄 Updating Shoe Cleaning & Repair Option Groups and Variants...');

  // Update option groups
  for (const [name, imageUrl] of Object.entries(optionGroupImages)) {
    const res = await prisma.serviceOptionGroup.updateMany({
      where: { name },
      data: { imageUrl },
    });
    console.log(`✅ Updated group "${name}": ${res.count} record(s)`);
  }

  // Update variants
  for (const [name, imageUrl] of Object.entries(variantImages)) {
    const res = await prisma.serviceVariant.updateMany({
      where: { name },
      data: { imageUrl },
    });
    console.log(`✅ Updated variant "${name}": ${res.count} record(s)`);
  }

  console.log('✨ All Shoe Cleaning & Repair images successfully updated!');
}

main()
  .catch((e) => {
    console.error('Error updating shoe images:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
