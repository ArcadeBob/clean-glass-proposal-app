import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 12)
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('✅ Created test user:', user.email)

  // Create test general contractors
  const gc1 = await prisma.generalContractor.upsert({
    where: { id: 'gc-test-1' },
    update: {},
    create: {
      id: 'gc-test-1',
      name: 'John Smith',
      email: 'john.smith@construction.com',
      phone: '(555) 123-4567',
      company: 'Smith Construction Co.',
      address: '123 Main St, Anytown, USA',
    },
  })

  const gc2 = await prisma.generalContractor.upsert({
    where: { id: 'gc-test-2' },
    update: {},
    create: {
      id: 'gc-test-2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@builders.com',
      phone: '(555) 987-6543',
      company: 'Johnson Builders LLC',
      address: '456 Oak Ave, Somewhere, USA',
    },
  })

  console.log('✅ Created test general contractors')

  // Create test proposal
  const proposal = await prisma.proposal.create({
    data: {
      title: 'Office Building Glass Installation',
      description: 'Complete glass installation for 3-story office building',
      status: 'DRAFT',
      totalAmount: 125000.00,
      overheadPercentage: 15.00,
      profitMargin: 20.00,
      riskScore: 3,
      winProbability: 75.00,
      projectName: 'Downtown Office Complex',
      projectAddress: '789 Business Blvd, Downtown, USA',
      projectType: 'COMMERCIAL',
      squareFootage: 15000.00,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      estimatedStartDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      estimatedEndDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days from now
      userId: user.id,
      generalContractorId: gc1.id,
      items: {
        create: [
          {
            name: 'Tempered Glass Panels',
            description: '1/2" tempered glass panels for exterior walls',
            quantity: 5000.00,
            unit: 'SF',
            unitCost: 15.00,
            totalCost: 75000.00,
            category: 'GLASS',
          },
          {
            name: 'Aluminum Framing',
            description: 'Aluminum storefront framing system',
            quantity: 2000.00,
            unit: 'LF',
            unitCost: 12.50,
            totalCost: 25000.00,
            category: 'FRAMING',
          },
          {
            name: 'Silicone Sealant',
            description: 'High-performance silicone sealant',
            quantity: 100.00,
            unit: 'TUBES',
            unitCost: 8.00,
            totalCost: 800.00,
            category: 'SEALANT',
          },
          {
            name: 'Installation Labor',
            description: 'Professional installation services',
            quantity: 1.00,
            unit: 'LOT',
            unitCost: 15000.00,
            totalCost: 15000.00,
            category: 'LABOR',
          },
          {
            name: 'Hardware & Accessories',
            description: 'Miscellaneous hardware and installation accessories',
            quantity: 1.00,
            unit: 'LOT',
            unitCost: 2200.00,
            totalCost: 2200.00,
            category: 'HARDWARE',
          },
        ],
      },
    },
  })

  console.log('✅ Created test proposal:', proposal.title)

  // Create another proposal for different project type
  const proposal2 = await prisma.proposal.create({
    data: {
      title: 'Residential Window Replacement',
      description: 'Replace all windows in residential home',
      status: 'SENT',
      totalAmount: 45000.00,
      overheadPercentage: 12.00,
      profitMargin: 18.00,
      riskScore: 1,
      winProbability: 85.00,
      projectName: 'Modern Home Renovation',
      projectAddress: '321 Elm St, Suburbia, USA',
      projectType: 'RESIDENTIAL',
      squareFootage: 2500.00,
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      estimatedStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      estimatedEndDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      userId: user.id,
      generalContractorId: gc2.id,
      items: {
        create: [
          {
            name: 'Double-Pane Windows',
            description: 'Energy-efficient double-pane windows',
            quantity: 15.00,
            unit: 'EACH',
            unitCost: 1800.00,
            totalCost: 27000.00,
            category: 'GLASS',
          },
          {
            name: 'Window Frames',
            description: 'Vinyl window frames',
            quantity: 15.00,
            unit: 'EACH',
            unitCost: 400.00,
            totalCost: 6000.00,
            category: 'FRAMING',
          },
          {
            name: 'Installation Labor',
            description: 'Window installation and cleanup',
            quantity: 1.00,
            unit: 'LOT',
            unitCost: 8000.00,
            totalCost: 8000.00,
            category: 'LABOR',
          },
          {
            name: 'Caulking & Weather Stripping',
            description: 'Sealants and weatherproofing materials',
            quantity: 1.00,
            unit: 'LOT',
            unitCost: 1000.00,
            totalCost: 1000.00,
            category: 'SEALANT',
          },
          {
            name: 'Hardware & Screws',
            description: 'Installation hardware and fasteners',
            quantity: 1.00,
            unit: 'LOT',
            unitCost: 500.00,
            totalCost: 500.00,
            category: 'HARDWARE',
          },
        ],
      },
    },
  })

  console.log('✅ Created second test proposal:', proposal2.title)

  console.log('🎉 Database seeding completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`- Users: 1`)
  console.log(`- General Contractors: 2`)
  console.log(`- Proposals: 2`)
  console.log(`- Proposal Items: 10`)
  console.log('\n🔑 Test Login:')
  console.log(`- Email: test@example.com`)
  console.log(`- Password: password123`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 