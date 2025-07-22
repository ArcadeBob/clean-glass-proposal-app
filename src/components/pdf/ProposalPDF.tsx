import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import React from 'react';
import { calculateProposalPrice } from '../../lib/calculations/proposal-calculations';
import { ProposalFormData } from '../wizard/ProposalWizard';

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
          <View style={styles.logoSection}>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>Clean Glass Proposals</Text>
              <Text style={styles.companyTagline}>
                Professional Glazing Solutions
              </Text>
              <Text style={styles.companyDetails}>
                123 Glass Street, Glazing City, GC 12345
              </Text>
              <Text style={styles.companyDetails}>
                Phone: (555) 123-4567 | Email: info@cleanglass.com
              </Text>
            </View>
            <View style={styles.proposalInfo}>
              <Text style={styles.proposalNumber}>
                Proposal: {data.projectName.substring(0, 5)}
              </Text>
              <Text style={styles.proposalDate}>{currentDate}</Text>
            </View>
          </View>
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

        {/* Terms and Conditions */}
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Terms and Conditions</Text>
          <Text style={styles.termsContent}>
            This proposal is valid for 30 days from the date of issue. All
            prices are subject to change without prior notice.
          </Text>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Accepted By:</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureInfo}>____________________</Text>
            <Text style={styles.signatureInfo}>Date: {currentDate}</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Prepared By:</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureInfo}>____________________</Text>
            <Text style={styles.signatureInfo}>Clean Glass Proposals</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Thank you for considering Clean Glass Proposals for your project.
          </Text>
          <Text>We look forward to working with you!</Text>
        </View>
      </Page>
    </Document>
  );
};
