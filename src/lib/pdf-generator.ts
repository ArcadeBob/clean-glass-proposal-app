import { ProposalFormData } from '@/components/wizard/ProposalWizard';
import {
  Document,
  Page,
  renderToStream,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import React from 'react';
import { calculateProposalPrice } from './calculations/proposal-calculations';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontSize: 12,
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #2563eb',
    paddingBottom: 20,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 5,
  },
  companyInfo: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1f2937',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#374151',
    backgroundColor: '#f3f4f6',
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    borderBottom: '1 solid #e5e7eb',
    paddingBottom: 5,
  },
  label: {
    width: '40%',
    fontWeight: 'bold',
    color: '#4b5563',
  },
  value: {
    width: '60%',
    color: '#1f2937',
  },
  pricingSection: {
    backgroundColor: '#f0fdf4',
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  pricingLabel: {
    color: '#166534',
    fontWeight: 'bold',
  },
  pricingValue: {
    color: '#166534',
    fontWeight: 'bold',
  },
  finalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#166534',
    borderTop: '2 solid #22c55e',
    paddingTop: 10,
    marginTop: 10,
  },
  notes: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#eff6ff',
    borderRadius: 5,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e40af',
  },
  notesContent: {
    color: '#1e40af',
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 10,
    color: '#6b7280',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10,
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

  // Create the PDF document using React.createElement
  const pdfDocument = React.createElement(
    Document,
    {},
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          Text,
          { style: styles.companyName },
          'Clean Glass Proposals'
        ),
        React.createElement(
          Text,
          { style: styles.companyInfo },
          'Professional Glazing Solutions'
        ),
        React.createElement(
          Text,
          { style: styles.companyInfo },
          '123 Glass Street, Glazing City, GC 12345'
        ),
        React.createElement(
          Text,
          { style: styles.companyInfo },
          'Phone: (555) 123-4567 | Email: info@cleanglass.com'
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
      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(
          Text,
          {},
          'This proposal is valid for 30 days from the date of issue.'
        ),
        React.createElement(
          Text,
          {},
          'Thank you for considering Clean Glass Proposals for your project.'
        )
      )
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
