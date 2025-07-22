import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { exportType, filters, format = 'CSV' } = body;

    if (!exportType) {
      return NextResponse.json(
        { error: 'Export type is required' },
        { status: 400 }
      );
    }

    let data: any[] = [];
    let recordCount = 0;

    // Export data based on type
    switch (exportType) {
      case 'PROPOSALS':
        data = await exportProposals(filters);
        break;
      case 'USERS':
        data = await exportUsers(filters);
        break;
      case 'RISK_ASSESSMENTS':
        data = await exportRiskAssessments(filters);
        break;
      case 'MARKET_DATA':
        data = await exportMarketData(filters);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid export type' },
          { status: 400 }
        );
    }

    recordCount = data.length;

    // Convert to requested format
    let exportContent: string;
    let contentType: string;

    switch (format) {
      case 'CSV':
        exportContent = convertToCSV(data);
        contentType = 'text/csv';
        break;
      case 'JSON':
        exportContent = JSON.stringify(data, null, 2);
        contentType = 'application/json';
        break;
      default:
        exportContent = convertToCSV(data);
        contentType = 'text/csv';
    }

    // Create filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${exportType.toLowerCase()}_export_${timestamp}.${format.toLowerCase()}`;

    return new NextResponse(exportContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': Buffer.byteLength(exportContent, 'utf8').toString(),
      },
    });
  } catch (error) {
    console.error('Export failed:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

// Helper functions for data export
async function exportProposals(filters?: Record<string, any>) {
  const proposals = await prisma.proposal.findMany({
    where: filters,
    include: {
      user: { select: { name: true, email: true } },
      generalContractor: { select: { name: true, company: true } },
      items: true,
      riskAssessment: true,
    },
  });

  return proposals.map(proposal => ({
    id: proposal.id,
    title: proposal.title,
    status: proposal.status,
    totalAmount: proposal.totalAmount.toString(),
    projectName: proposal.projectName,
    projectAddress: proposal.projectAddress,
    projectType: proposal.projectType,
    squareFootage: proposal.squareFootage?.toString(),
    proposalDate: proposal.proposalDate.toISOString(),
    createdBy: proposal.user.email,
    contractor: proposal.generalContractor?.name,
    itemCount: proposal.items.length,
    hasRiskAssessment: !!proposal.riskAssessment,
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
  }));
}

async function exportUsers(filters?: Record<string, any>) {
  const users = await prisma.user.findMany({
    where: filters,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return users.map(user => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));
}

async function exportRiskAssessments(filters?: Record<string, any>) {
  const assessments = await prisma.riskAssessment.findMany({
    where: filters,
    include: {
      proposal: { select: { title: true, projectName: true } },
      factorAssessments: {
        include: {
          riskFactor: {
            select: { name: true, category: { select: { name: true } } },
          },
        },
      },
    },
  });

  return assessments.map(assessment => ({
    id: assessment.id,
    proposalTitle: assessment.proposal.title,
    projectName: assessment.proposal.projectName,
    totalRiskScore: assessment.totalRiskScore.toString(),
    riskLevel: assessment.riskLevel,
    contingencyRate: assessment.contingencyRate.toString(),
    factorCount: assessment.factorAssessments.length,
    createdAt: assessment.createdAt.toISOString(),
  }));
}

async function exportMarketData(filters?: Record<string, any>) {
  const marketData = await prisma.marketData.findMany({
    where: filters,
    orderBy: { effectiveDate: 'desc' },
  });

  return marketData.map(data => ({
    ...data,
    value: data.value.toString(),
    effectiveDate: data.effectiveDate.toISOString(),
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  }));
}

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers,
    ...data.map(row => headers.map(header => row[header])),
  ];

  return csvRows
    .map(row =>
      row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
    )
    .join('\n');
}
