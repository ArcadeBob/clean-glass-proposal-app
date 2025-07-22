import { ProposalFormData } from '@/components/wizard/ProposalWizard';
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToStream,
} from '@react-pdf/renderer';
import React from 'react';
import { calculateProposalPrice } from './calculations/proposal-calculations';

// Enhanced styles for professional appearance
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '3 solid #1e40af',
    paddingBottom: 20,
    position: 'relative',
  },
  logoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  companyTagline: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  companyDetails: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 3,
    lineHeight: 1.3,
  },
  proposalInfo: {
    alignItems: 'flex-end',
    textAlign: 'right',
  },
  proposalNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  proposalDate: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#1f2937',
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottom: '2 solid #e5e7eb',
    paddingBottom: 10,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1e40af',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderLeft: '4 solid #1e40af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    borderBottom: '1 solid #f1f5f9',
    paddingBottom: 8,
    minHeight: 20,
  },
  label: {
    width: '35%',
    fontWeight: 'bold',
    color: '#374151',
    fontSize: 9,
  },
  value: {
    width: '65%',
    color: '#1f2937',
    fontSize: 9,
  },
  pricingSection: {
    backgroundColor: '#f0fdf4',
    padding: 20,
    borderRadius: 8,
    marginTop: 15,
    border: '2 solid #22c55e',
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4,
  },
  pricingLabel: {
    color: '#166534',
    fontWeight: 'bold',
    fontSize: 9,
  },
  pricingValue: {
    color: '#166534',
    fontWeight: 'bold',
    fontSize: 9,
  },
  finalPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#166534',
    borderTop: '2 solid #22c55e',
    paddingTop: 12,
    marginTop: 12,
  },
  notes: {
    marginTop: 25,
    padding: 20,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    border: '1 solid #3b82f6',
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1e40af',
    textTransform: 'uppercase',
  },
  notesContent: {
    color: '#1e40af',
    lineHeight: 1.5,
    fontSize: 9,
  },
  termsSection: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    border: '1 solid #f59e0b',
  },
  termsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#92400e',
    textTransform: 'uppercase',
  },
  termsContent: {
    color: '#92400e',
    lineHeight: 1.4,
    fontSize: 8,
  },
  signatureSection: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    borderTop: '1 solid #6b7280',
    paddingTop: 10,
    marginTop: 30,
  },
  signatureLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 5,
    textAlign: 'center',
  },
  signatureLine: {
    borderBottom: '1 solid #6b7280',
    height: 30,
    marginBottom: 5,
  },
  signatureInfo: {
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#6b7280',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 15,
    right: 40,
    fontSize: 8,
    color: '#6b7280',
  },
});

const formatProjectType = (type: string) => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const formatGlassType = (type: string) => {
  const types: Record<string, string> = {
    clear: 'Clear Glass',
    tinted: 'Tinted Glass',
    reflective: 'Reflective Glass',
    low_e: 'Low-E Glass',
    tempered: 'Tempered Glass',
  };
  return types[type] || type;
};

const formatFramingType = (type: string) => {
  const types: Record<string, string> = {
    aluminum: 'Aluminum',
    steel: 'Steel',
    wood: 'Wood',
    vinyl: 'Vinyl',
  };
  return types[type] || type;
};

const formatHardwareType = (type: string) => {
  const types: Record<string, string> = {
    standard: 'Standard',
    premium: 'Premium',
    custom: 'Custom',
  };
  return types[type] || type;
};

export async function generateProposalPDF(
  data: ProposalFormData
): Promise<Buffer> {
  const finalPrice = calculateProposalPrice({
    squareFootage: data.squareFootage,
    glassType: data.glassType,
    framingType: data.framingType,
    hardwareType: data.hardwareType,
    quantity: data.quantity,
    overheadPercentage: data.overheadPercentage,
    profitMargin: data.profitMargin,
    riskFactor: data.riskFactor,
  });

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Generate proposal number
  const proposalNumber = `PROP-${Date.now().toString().slice(-6)}`;

  // Create the PDF document using React.createElement
  const pdfDocument = React.createElement(
    Document,
    {},
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      // Enhanced Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          View,
          { style: styles.logoSection },
          React.createElement(
            View,
            { style: styles.companyInfo },
            React.createElement(
              Text,
              { style: styles.companyName },
              'Clean Glass Proposals'
            ),
            React.createElement(
              Text,
              { style: styles.companyTagline },
              'Professional Glazing Solutions'
            ),
            React.createElement(
              Text,
              { style: styles.companyDetails },
              '123 Glass Street, Glazing City, GC 12345'
            ),
            React.createElement(
              Text,
              { style: styles.companyDetails },
              'Phone: (555) 123-4567 | Email: info@cleanglass.com'
            ),
            React.createElement(
              Text,
              { style: styles.companyDetails },
              'License: GC-12345 | Insurance: $2M General Liability'
            )
          ),
          React.createElement(
            View,
            { style: styles.proposalInfo },
            React.createElement(
              Text,
              { style: styles.proposalNumber },
              `Proposal #${proposalNumber}`
            ),
            React.createElement(
              Text,
              { style: styles.proposalDate },
              `Date: ${currentDate}`
            ),
            React.createElement(
              Text,
              { style: styles.proposalDate },
              'Valid for 30 days'
            )
          )
        )
      ),
      // Title
      React.createElement(
        Text,
        { style: styles.title },
        `PROPOSAL: ${data.projectName}`
      ),
      // Project Details
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(
          Text,
          { style: styles.sectionTitle },
          'Project Details'
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Project Name:'),
          React.createElement(Text, { style: styles.value }, data.projectName)
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Project Type:'),
          React.createElement(
            Text,
            { style: styles.value },
            formatProjectType(data.projectType)
          )
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(
            Text,
            { style: styles.label },
            'Project Address:'
          ),
          React.createElement(
            Text,
            { style: styles.value },
            data.projectAddress
          )
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Square Footage:'),
          React.createElement(
            Text,
            { style: styles.value },
            `${data.squareFootage.toLocaleString()} sq ft`
          )
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Date:'),
          React.createElement(Text, { style: styles.value }, currentDate)
        )
      ),
      // Glass Specifications
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(
          Text,
          { style: styles.sectionTitle },
          'Glass Specifications'
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Glass Type:'),
          React.createElement(
            Text,
            { style: styles.value },
            formatGlassType(data.glassType)
          )
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Framing Type:'),
          React.createElement(
            Text,
            { style: styles.value },
            formatFramingType(data.framingType)
          )
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Hardware Type:'),
          React.createElement(
            Text,
            { style: styles.value },
            formatHardwareType(data.hardwareType)
          )
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Quantity:'),
          React.createElement(
            Text,
            { style: styles.value },
            `${data.quantity} units`
          )
        )
      ),
      // Pricing Configuration
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(
          Text,
          { style: styles.sectionTitle },
          'Pricing Configuration'
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(
            Text,
            { style: styles.label },
            'Overhead Percentage:'
          ),
          React.createElement(
            Text,
            { style: styles.value },
            `${data.overheadPercentage}%`
          )
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Profit Margin:'),
          React.createElement(
            Text,
            { style: styles.value },
            `${data.profitMargin}%`
          )
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Risk Factor:'),
          React.createElement(
            Text,
            { style: styles.value },
            `${data.riskFactor}%`
          )
        )
      ),
      // Price Breakdown
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(
          Text,
          { style: styles.sectionTitle },
          'Price Breakdown'
        ),
        React.createElement(
          View,
          { style: styles.pricingSection },
          React.createElement(
            View,
            { style: styles.pricingRow },
            React.createElement(
              Text,
              { style: styles.pricingLabel },
              'Base Cost:'
            ),
            React.createElement(
              Text,
              { style: styles.pricingValue },
              `$${finalPrice.baseCost.toFixed(2)}`
            )
          ),
          React.createElement(
            View,
            { style: styles.pricingRow },
            React.createElement(
              Text,
              { style: styles.pricingLabel },
              `With Overhead (${data.overheadPercentage}%):`
            ),
            React.createElement(
              Text,
              { style: styles.pricingValue },
              `$${finalPrice.withOverhead.toFixed(2)}`
            )
          ),
          React.createElement(
            View,
            { style: styles.pricingRow },
            React.createElement(
              Text,
              { style: styles.pricingLabel },
              `Profit Margin (${data.profitMargin}%):`
            ),
            React.createElement(
              Text,
              { style: styles.pricingValue },
              `$${((finalPrice.withOverhead * data.profitMargin) / 100).toFixed(2)}`
            )
          ),
          React.createElement(
            View,
            { style: styles.pricingRow },
            React.createElement(
              Text,
              { style: styles.pricingLabel },
              `Risk Factor (${data.riskFactor}%):`
            ),
            React.createElement(
              Text,
              { style: styles.pricingValue },
              `$${((finalPrice.withOverhead * data.riskFactor) / 100).toFixed(2)}`
            )
          ),
          React.createElement(
            View,
            { style: styles.pricingRow },
            React.createElement(
              Text,
              { style: styles.finalPrice },
              'Final Price:'
            ),
            React.createElement(
              Text,
              { style: styles.finalPrice },
              `$${finalPrice.finalPrice.toFixed(2)}`
            )
          )
        )
      ),
      // Additional Notes
      data.notes &&
        React.createElement(
          View,
          { style: styles.notes },
          React.createElement(
            Text,
            { style: styles.notesTitle },
            'Additional Notes'
          ),
          React.createElement(Text, { style: styles.notesContent }, data.notes)
        ),

      // Terms and Conditions
      React.createElement(
        View,
        { style: styles.termsSection },
        React.createElement(
          Text,
          { style: styles.termsTitle },
          'Terms and Conditions'
        ),
        React.createElement(
          Text,
          { style: styles.termsContent },
          '1. This proposal is valid for 30 days from the date of issue.\n\n' +
            '2. Payment terms: 50% deposit upon contract signing, balance due upon project completion.\n\n' +
            '3. Project timeline will be confirmed upon contract signing and may vary based on material availability.\n\n' +
            '4. All work includes standard warranty of 2 years on materials and 1 year on labor.\n\n' +
            '5. Change orders must be submitted in writing and may affect project timeline and pricing.\n\n' +
            '6. Clean Glass Proposals maintains $2M general liability insurance and workers compensation coverage.\n\n' +
            '7. Permits and inspections are the responsibility of the client unless otherwise specified.\n\n' +
            '8. Weather delays and force majeure events may extend project timeline without penalty.'
        )
      ),

      // Signature Section
      React.createElement(
        View,
        { style: styles.signatureSection },
        React.createElement(
          View,
          { style: styles.signatureBox },
          React.createElement(
            Text,
            { style: styles.signatureLabel },
            'Client Signature'
          ),
          React.createElement(View, { style: styles.signatureLine }),
          React.createElement(
            Text,
            { style: styles.signatureInfo },
            'Print Name: _________________'
          ),
          React.createElement(
            Text,
            { style: styles.signatureInfo },
            'Date: _________________'
          )
        ),
        React.createElement(
          View,
          { style: styles.signatureBox },
          React.createElement(
            Text,
            { style: styles.signatureLabel },
            'Company Representative'
          ),
          React.createElement(View, { style: styles.signatureLine }),
          React.createElement(
            Text,
            { style: styles.signatureInfo },
            'Print Name: _________________'
          ),
          React.createElement(
            Text,
            { style: styles.signatureInfo },
            'Date: _________________'
          )
        )
      ),

      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(
          Text,
          {},
          'Thank you for considering Clean Glass Proposals for your project.'
        ),
        React.createElement(Text, {}, 'We look forward to working with you!')
      ),

      // Page Number
      React.createElement(Text, { style: styles.pageNumber }, 'Page 1 of 1')
    )
  );

  // Generate PDF stream
  const stream = await renderToStream(pdfDocument);

  // Convert stream to buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    if (chunk instanceof Uint8Array) {
      chunks.push(chunk);
    } else if (typeof chunk === 'string') {
      chunks.push(new TextEncoder().encode(chunk));
    }
  }

  return Buffer.concat(chunks);
}
