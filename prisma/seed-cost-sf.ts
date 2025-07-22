import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.marketData.createMany({
    data: [
      {
        dataType: 'COST_PER_SF',
        region: 'Northeast',
        value: 45.0,
        unit: 'SF',
        source: 'RSMeans 2024',
        effectiveDate: new Date('2024-01-01'),
        notes: 'Commercial glazing, typical project',
      },
      {
        dataType: 'COST_PER_SF',
        region: 'Midwest',
        value: 42.5,
        unit: 'SF',
        source: 'RSMeans 2024',
        effectiveDate: new Date('2024-01-01'),
        notes: 'Commercial glazing, typical project',
      },
      {
        dataType: 'COST_PER_SF',
        region: 'South',
        value: 40.0,
        unit: 'SF',
        source: 'RSMeans 2024',
        effectiveDate: new Date('2024-01-01'),
        notes: 'Commercial glazing, typical project',
      },
      {
        dataType: 'COST_PER_SF',
        region: 'West',
        value: 47.0,
        unit: 'SF',
        source: 'RSMeans 2024',
        effectiveDate: new Date('2024-01-01'),
        notes: 'Commercial glazing, typical project',
      },
    ],
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
