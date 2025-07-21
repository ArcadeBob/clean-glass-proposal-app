import { generateProposalPDF } from '@/lib/pdf-generator';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for the request body
const generatePDFSchema = z.object({
  projectName: z.string().min(1, 'Project name is required'),
  projectAddress: z.string().min(1, 'Project address is required'),
  projectType: z.enum(['residential', 'commercial', 'industrial']),
  squareFootage: z.number().min(1, 'Square footage must be greater than 0'),
  glassType: z.enum(['clear', 'tinted', 'reflective', 'low_e', 'tempered']),
  framingType: z.enum(['aluminum', 'steel', 'wood', 'vinyl']),
  hardwareType: z.enum(['standard', 'premium', 'custom']),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  overheadPercentage: z.number().min(0).max(100),
  profitMargin: z.number().min(0).max(100),
  riskFactor: z.number().min(0).max(50),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = generatePDFSchema.parse(body);

    // Generate PDF buffer
    const buffer = await generateProposalPDF(validatedData);

    // Return the PDF with appropriate headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proposal-${validatedData.projectName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
