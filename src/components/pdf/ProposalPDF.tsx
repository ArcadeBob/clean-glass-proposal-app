import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import React from 'react';
import { calculateProposalPrice } from '../../lib/calculations/proposal-calculations';
import { ProposalFormData } from '../wizard/ProposalWizard';

// Register fonts (optional - using default fonts for now)
// Font.register({
//   family: 'Open Sans',
//   src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-400.ttf',
// });

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

interface ProposalPDFProps {
  data: ProposalFormData;
}

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

export const ProposalPDF: React.FC<ProposalPDFProps> = ({ data }) => {
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>Clean Glass Proposals</Text>
          <Text style={styles.companyInfo}>Professional Glazing Solutions</Text>
          <Text style={styles.companyInfo}>
            123 Glass Street, Glazing City, GC 12345
          </Text>
          <Text style={styles.companyInfo}>
            Phone: (555) 123-4567 | Email: info@cleanglass.com
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>PROPOSAL: {data.projectName}</Text>

        {/* Project Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Project Name:</Text>
            <Text style={styles.value}>{data.projectName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Project Type:</Text>
            <Text style={styles.value}>
              {formatProjectType(data.projectType)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Project Address:</Text>
            <Text style={styles.value}>{data.projectAddress}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Square Footage:</Text>
            <Text style={styles.value}>
              {data.squareFootage.toLocaleString()} sq ft
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{currentDate}</Text>
          </View>
        </View>

        {/* Glass Specifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Glass Specifications</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Glass Type:</Text>
            <Text style={styles.value}>{formatGlassType(data.glassType)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Framing Type:</Text>
            <Text style={styles.value}>
              {formatFramingType(data.framingType)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Hardware Type:</Text>
            <Text style={styles.value}>
              {formatHardwareType(data.hardwareType)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Quantity:</Text>
            <Text style={styles.value}>{data.quantity} units</Text>
          </View>
        </View>

        {/* Pricing Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Configuration</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Overhead Percentage:</Text>
            <Text style={styles.value}>{data.overheadPercentage}%</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Profit Margin:</Text>
            <Text style={styles.value}>{data.profitMargin}%</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Risk Factor:</Text>
            <Text style={styles.value}>{data.riskFactor}%</Text>
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          <View style={styles.pricingSection}>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Base Cost:</Text>
              <Text style={styles.pricingValue}>
                ${finalPrice.baseCost.toFixed(2)}
              </Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>
                With Overhead ({data.overheadPercentage}%):
              </Text>
              <Text style={styles.pricingValue}>
                ${finalPrice.withOverhead.toFixed(2)}
              </Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>
                Profit Margin ({data.profitMargin}%):
              </Text>
              <Text style={styles.pricingValue}>
                $
                {((finalPrice.withOverhead * data.profitMargin) / 100).toFixed(
                  2
                )}
              </Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>
                Risk Factor ({data.riskFactor}%):
              </Text>
              <Text style={styles.pricingValue}>
                $
                {((finalPrice.withOverhead * data.riskFactor) / 100).toFixed(2)}
              </Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.finalPrice}>Final Price:</Text>
              <Text style={styles.finalPrice}>
                ${finalPrice.finalPrice.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Additional Notes */}
        {data.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Additional Notes</Text>
            <Text style={styles.notesContent}>{data.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            This proposal is valid for 30 days from the date of issue.
          </Text>
          <Text>
            Thank you for considering Clean Glass Proposals for your project.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
