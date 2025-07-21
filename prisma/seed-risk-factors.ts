import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRiskFactors() {
  console.log('🌱 Seeding risk factors...');

  // Create risk categories
  const categories = [
    {
      name: 'Schedule Risks',
      description: 'Risks related to project timeline and scheduling',
      weight: 25.0,
      sortOrder: 1,
    },
    {
      name: 'Technical Risks',
      description: 'Risks related to technical complexity and requirements',
      weight: 20.0,
      sortOrder: 2,
    },
    {
      name: 'Financial Risks',
      description: 'Risks related to costs, pricing, and financial factors',
      weight: 30.0,
      sortOrder: 3,
    },
    {
      name: 'Operational Risks',
      description: 'Risks related to operations, logistics, and execution',
      weight: 15.0,
      sortOrder: 4,
    },
    {
      name: 'Environmental Risks',
      description: 'Risks related to environmental factors and site conditions',
      weight: 10.0,
      sortOrder: 5,
    },
  ];

  // Create categories
  const createdCategories = [];
  for (const category of categories) {
    const created = await prisma.riskCategory.upsert({
      where: { name: category.name },
      update: category,
      create: category,
    });
    createdCategories.push(created);
    console.log(`✅ Created category: ${category.name}`);
  }

  // Define risk factors by category
  const riskFactors = [
    // Schedule Risks
    {
      name: 'Weather Delays',
      description: 'Potential delays due to adverse weather conditions',
      categoryName: 'Schedule Risks',
      weight: 35.0,
      scoringType: 'CATEGORICAL',
      dataType: 'CATEGORICAL',
      options: {
        values: [
          { label: 'Minimal Risk (0-5 days)', score: 10 },
          { label: 'Low Risk (5-10 days)', score: 25 },
          { label: 'Medium Risk (10-20 days)', score: 50 },
          { label: 'High Risk (20-30 days)', score: 75 },
          { label: 'Critical Risk (30+ days)', score: 100 },
        ],
      },
      sortOrder: 1,
    },
    {
      name: 'Permit Delays',
      description: 'Delays in obtaining necessary permits and approvals',
      categoryName: 'Schedule Risks',
      weight: 25.0,
      scoringType: 'CATEGORICAL',
      dataType: 'CATEGORICAL',
      options: {
        values: [
          { label: 'Permits in hand', score: 0 },
          { label: 'Permits pending, expected approval', score: 20 },
          { label: 'Permits pending, uncertain timeline', score: 40 },
          { label: 'Permits not yet applied for', score: 60 },
          { label: 'Complex permitting requirements', score: 80 },
        ],
      },
      sortOrder: 2,
    },
    {
      name: 'Seasonal Constraints',
      description: 'Project timeline affected by seasonal factors',
      categoryName: 'Schedule Risks',
      weight: 20.0,
      scoringType: 'CATEGORICAL',
      dataType: 'CATEGORICAL',
      options: {
        values: [
          { label: 'No seasonal constraints', score: 0 },
          { label: 'Minor seasonal impact', score: 15 },
          { label: 'Moderate seasonal constraints', score: 35 },
          { label: 'Major seasonal constraints', score: 60 },
          { label: 'Critical seasonal limitations', score: 85 },
        ],
      },
      sortOrder: 3,
    },
    {
      name: 'Material Lead Times',
      description: 'Delays due to material availability and lead times',
      categoryName: 'Schedule Risks',
      weight: 20.0,
      scoringType: 'LINEAR',
      dataType: 'NUMERIC',
      minValue: 0,
      maxValue: 90,
      defaultValue: 14,
      formula:
        'score = (days - 7) * 1.5; if (score < 0) score = 0; if (score > 100) score = 100;',
      sortOrder: 4,
    },

    // Technical Risks
    {
      name: 'Project Complexity',
      description: 'Technical complexity of the glazing project',
      categoryName: 'Technical Risks',
      weight: 30.0,
      scoringType: 'CATEGORICAL',
      dataType: 'CATEGORICAL',
      options: {
        values: [
          { label: 'Standard installation', score: 10 },
          { label: 'Minor customizations', score: 25 },
          { label: 'Moderate complexity', score: 45 },
          { label: 'High complexity', score: 70 },
          { label: 'Extreme complexity', score: 90 },
        ],
      },
      sortOrder: 1,
    },
    {
      name: 'New Technology',
      description: 'Use of new or untested technologies or materials',
      categoryName: 'Technical Risks',
      weight: 25.0,
      scoringType: 'CATEGORICAL',
      dataType: 'CATEGORICAL',
      options: {
        values: [
          { label: 'Proven technology only', score: 0 },
          { label: 'Minor new elements', score: 20 },
          { label: 'Some new technology', score: 40 },
          { label: 'Significant new technology', score: 65 },
          { label: 'Cutting-edge technology', score: 85 },
        ],
      },
      sortOrder: 2,
    },
    {
      name: 'Site Access',
      description: 'Complexity of site access and logistics',
      categoryName: 'Technical Risks',
      weight: 20.0,
      scoringType: 'CATEGORICAL',
      dataType: 'CATEGORICAL',
      options: {
        values: [
          { label: 'Easy access', score: 5 },
          { label: 'Standard access', score: 15 },
          { label: 'Limited access', score: 35 },
          { label: 'Difficult access', score: 60 },
          { label: 'Extreme access challenges', score: 85 },
        ],
      },
      sortOrder: 3,
    },
    {
      name: 'Height and Safety',
      description: 'Safety risks due to working at heights',
      categoryName: 'Technical Risks',
      weight: 25.0,
      scoringType: 'LINEAR',
      dataType: 'NUMERIC',
      minValue: 0,
      maxValue: 100,
      defaultValue: 10,
      formula: 'score = height * 0.8; if (score > 100) score = 100;',
      sortOrder: 4,
    },

    // Financial Risks
    {
      name: 'Material Price Volatility',
      description: 'Risk of material price fluctuations during project',
      categoryName: 'Financial Risks',
      weight: 35.0,
      scoringType: 'EXPONENTIAL',
      dataType: 'PERCENTAGE',
      minValue: 0,
      maxValue: 50,
      defaultValue: 5,
      formula:
        'score = Math.pow(volatility * 2, 1.5); if (score > 100) score = 100;',
      sortOrder: 1,
    },
    {
      name: 'Labor Availability',
      description: 'Availability of skilled labor for the project',
      categoryName: 'Financial Risks',
      weight: 25.0,
      scoringType: 'CATEGORICAL',
      dataType: 'CATEGORICAL',
      options: {
        values: [
          { label: 'Abundant skilled labor', score: 5 },
          { label: 'Adequate labor pool', score: 20 },
          { label: 'Limited labor availability', score: 45 },
          { label: 'Scarce skilled labor', score: 70 },
          { label: 'Critical labor shortage', score: 90 },
        ],
      },
      sortOrder: 2,
    },
    {
      name: 'Economic Conditions',
      description: 'Impact of current economic conditions on project costs',
      categoryName: 'Financial Risks',
      weight: 20.0,
      scoringType: 'CATEGORICAL',
      dataType: 'CATEGORICAL',
      options: {
        values: [
          { label: 'Stable economy', score: 10 },
          { label: 'Minor economic uncertainty', score: 25 },
          { label: 'Moderate economic volatility', score: 45 },
          { label: 'High economic uncertainty', score: 70 },
          { label: 'Economic crisis conditions', score: 90 },
        ],
      },
      sortOrder: 3,
    },
    {
      name: 'Currency Fluctuation',
      description: 'Risk from currency exchange rate fluctuations',
      categoryName: 'Financial Risks',
      weight: 20.0,
      scoringType: 'LINEAR',
      dataType: 'PERCENTAGE',
      minValue: 0,
      maxValue: 30,
      defaultValue: 2,
      formula: 'score = fluctuation * 3; if (score > 100) score = 100;',
      sortOrder: 4,
    },

    // Operational Risks
    {
      name: 'Subcontractor Reliability',
      description: 'Reliability and track record of subcontractors',
      categoryName: 'Operational Risks',
      weight: 40.0,
      scoringType: 'CATEGORICAL',
      dataType: 'CATEGORICAL',
      options: {
        values: [
          { label: 'Proven reliable subcontractors', score: 5 },
          { label: 'Generally reliable', score: 20 },
          { label: 'Mixed reliability', score: 45 },
          { label: 'Questionable reliability', score: 70 },
          { label: 'Unknown or unreliable', score: 90 },
        ],
      },
      sortOrder: 1,
    },
    {
      name: 'Equipment Availability',
      description: 'Availability of required equipment and machinery',
      categoryName: 'Operational Risks',
      weight: 30.0,
      scoringType: 'CATEGORICAL',
      dataType: 'CATEGORICAL',
      options: {
        values: [
          { label: 'Equipment readily available', score: 5 },
          { label: 'Standard equipment needs', score: 20 },
          { label: 'Some specialized equipment', score: 40 },
          { label: 'Significant equipment challenges', score: 65 },
          { label: 'Critical equipment shortages', score: 85 },
        ],
      },
      sortOrder: 2,
    },
    {
      name: 'Quality Control',
      description: 'Complexity of quality control requirements',
      categoryName: 'Operational Risks',
      weight: 30.0,
      scoringType: 'CATEGORICAL',
      dataType: 'CATEGORICAL',
      options: {
        values: [
          { label: 'Standard QC requirements', score: 10 },
          { label: 'Enhanced QC needed', score: 25 },
          { label: 'Specialized QC procedures', score: 45 },
          { label: 'Complex QC requirements', score: 70 },
          { label: 'Extreme QC standards', score: 90 },
        ],
      },
      sortOrder: 3,
    },

    // Environmental Risks
    {
      name: 'Site Conditions',
      description: 'Environmental and site-specific conditions',
      categoryName: 'Environmental Risks',
      weight: 40.0,
      scoringType: 'CATEGORICAL',
      dataType: 'CATEGORICAL',
      options: {
        values: [
          { label: 'Ideal site conditions', score: 5 },
          { label: 'Standard site conditions', score: 20 },
          { label: 'Challenging site conditions', score: 45 },
          { label: 'Difficult site conditions', score: 70 },
          { label: 'Extreme site challenges', score: 90 },
        ],
      },
      sortOrder: 1,
    },
    {
      name: 'Environmental Regulations',
      description: 'Complexity of environmental compliance requirements',
      categoryName: 'Environmental Risks',
      weight: 35.0,
      scoringType: 'CATEGORICAL',
      dataType: 'CATEGORICAL',
      options: {
        values: [
          { label: 'Standard compliance', score: 10 },
          { label: 'Enhanced compliance', score: 25 },
          { label: 'Specialized compliance', score: 45 },
          { label: 'Complex compliance', score: 70 },
          { label: 'Extreme compliance requirements', score: 90 },
        ],
      },
      sortOrder: 2,
    },
    {
      name: 'Weather Sensitivity',
      description: 'Project sensitivity to weather conditions',
      categoryName: 'Environmental Risks',
      weight: 25.0,
      scoringType: 'CATEGORICAL',
      dataType: 'CATEGORICAL',
      options: {
        values: [
          { label: 'Weather independent', score: 0 },
          { label: 'Minimal weather impact', score: 15 },
          { label: 'Moderate weather sensitivity', score: 35 },
          { label: 'High weather sensitivity', score: 60 },
          { label: 'Extreme weather sensitivity', score: 85 },
        ],
      },
      sortOrder: 3,
    },
  ];

  // Create risk factors
  for (const factor of riskFactors) {
    const category = createdCategories.find(
      c => c.name === factor.categoryName
    );
    if (!category) {
      console.error(`❌ Category not found: ${factor.categoryName}`);
      continue;
    }

    const { categoryName, ...factorData } = factor;

    await prisma.riskFactor.upsert({
      where: {
        name_categoryId: {
          name: factor.name,
          categoryId: category.id,
        },
      },
      update: {
        ...factorData,
        categoryId: category.id,
      },
      create: {
        ...factorData,
        categoryId: category.id,
      },
    });

    console.log(
      `✅ Created risk factor: ${factor.name} (${factor.categoryName})`
    );
  }

  console.log('🎉 Risk factor seeding completed!');
}

async function main() {
  try {
    await seedRiskFactors();
  } catch (error) {
    console.error('❌ Error seeding risk factors:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { seedRiskFactors };
