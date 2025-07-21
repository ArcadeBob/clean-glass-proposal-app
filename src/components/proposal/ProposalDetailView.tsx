'use client';

import {
  Building,
  Calendar,
  Download,
  Edit,
  MapPin,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface ProposalItem {
  id: string;
  name: string;
  description?: string | null;
  quantity: number | { toString(): string };
  unit: string;
  unitCost: number | { toString(): string };
  totalCost: number | { toString(): string };
  category: string;
}

interface Proposal {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  totalAmount: number | { toString(): string };
  overheadPercentage: number | { toString(): string };
  profitMargin: number | { toString(): string };
  riskScore?: number | null;
  winProbability?: number | null | { toString(): string };
  projectName?: string | null;
  projectAddress?: string | null;
  projectType?: string | null;
  squareFootage?: number | null | { toString(): string };
  proposalDate: string | Date;
  validUntil?: string | null | Date;
  estimatedStartDate?: string | null | Date;
  estimatedEndDate?: string | null | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  items: ProposalItem[];
  generalContractor?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
  } | null;
}

interface ProposalDetailViewProps {
  proposal: Proposal;
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

const statusLabels = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
};

const categoryLabels = {
  GLASS: 'Glass',
  FRAMING: 'Framing',
  HARDWARE: 'Hardware',
  SEALANT: 'Sealant',
  ACCESSORIES: 'Accessories',
  LABOR: 'Labor',
  EQUIPMENT: 'Equipment',
  MATERIALS: 'Materials',
  OTHER: 'Other',
};

export default function ProposalDetailView({
  proposal,
}: ProposalDetailViewProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Convert proposal data to wizard format for PDF generation
      const pdfData = {
        projectName: proposal.projectName || proposal.title,
        projectAddress: proposal.projectAddress || '',
        projectType: proposal.projectType?.toLowerCase() || 'commercial',
        squareFootage: proposal.squareFootage || 0,
        glassType: 'clear', // Default values - would need to be extracted from items
        framingType: 'aluminum',
        hardwareType: 'standard',
        quantity: 1,
        overheadPercentage: proposal.overheadPercentage,
        profitMargin: proposal.profitMargin,
        riskFactor: proposal.riskScore || 0,
        notes: proposal.description || '',
      };

      const response = await fetch('/api/proposals/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pdfData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `proposal-${proposal.title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDeleteProposal = async () => {
    if (!confirm('Are you sure you want to delete this proposal?')) {
      return;
    }

    try {
      const response = await fetch(`/api/proposals/${proposal.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Error deleting proposal:', error);
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date =
      typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number | { toString(): string }) => {
    const numAmount =
      typeof amount === 'number' ? amount : parseFloat(amount.toString());
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numAmount);
  };

  const formatNumber = (value: number | { toString(): string }) => {
    return typeof value === 'number' ? value : parseFloat(value.toString());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{proposal.title}</h1>
          {proposal.description && (
            <p className="mt-2 text-gray-600">{proposal.description}</p>
          )}
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isGeneratingPDF ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </>
            )}
          </button>
          <Link
            href={`/proposal/${proposal.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={handleDeleteProposal}
            className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Status and Key Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Status</h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[proposal.status as keyof typeof statusColors]}`}
            >
              {statusLabels[proposal.status as keyof typeof statusLabels]}
            </span>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              Created: {formatDate(proposal.createdAt)}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              Updated: {formatDate(proposal.updatedAt)}
            </div>
            {proposal.validUntil && (
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                Valid until: {formatDate(proposal.validUntil)}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Financial Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-semibold text-lg">
                {formatCurrency(proposal.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Overhead:</span>
              <span>{formatNumber(proposal.overheadPercentage)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Profit Margin:</span>
              <span>{formatNumber(proposal.profitMargin)}%</span>
            </div>
            {proposal.riskScore !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Risk Score:</span>
                <span>{proposal.riskScore}/10</span>
              </div>
            )}
            {proposal.winProbability !== undefined &&
              proposal.winProbability !== null && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Win Probability:</span>
                  <span>{formatNumber(proposal.winProbability)}%</span>
                </div>
              )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Project Details
          </h3>
          <div className="space-y-3">
            {proposal.projectName && (
              <div className="flex items-center text-sm text-gray-600">
                <Building className="w-4 h-4 mr-2" />
                {proposal.projectName}
              </div>
            )}
            {proposal.projectAddress && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                {proposal.projectAddress}
              </div>
            )}
            {proposal.projectType && (
              <div className="text-sm text-gray-600">
                Type: {proposal.projectType}
              </div>
            )}
            {proposal.squareFootage && (
              <div className="text-sm text-gray-600">
                Square Footage:{' '}
                {formatNumber(proposal.squareFootage).toLocaleString()} sq ft
              </div>
            )}
            {proposal.generalContractor && (
              <div className="pt-3 border-t border-gray-200">
                <div className="text-sm font-medium text-gray-900">
                  General Contractor
                </div>
                <div className="text-sm text-gray-600">
                  {proposal.generalContractor.name}
                </div>
                {proposal.generalContractor.company && (
                  <div className="text-sm text-gray-600">
                    {proposal.generalContractor.company}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items Breakdown */}
      {proposal.items && proposal.items.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Items Breakdown
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Cost
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {proposal.items.map(item => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.name}
                        </div>
                        {item.description && (
                          <div className="text-sm text-gray-500">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {categoryLabels[
                        item.category as keyof typeof categoryLabels
                      ] || item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(item.quantity)} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.unitCost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(item.totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Timeline */}
      {(proposal.estimatedStartDate || proposal.estimatedEndDate) && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Project Timeline
          </h3>
          <div className="space-y-3">
            {proposal.estimatedStartDate && (
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                Estimated Start: {formatDate(proposal.estimatedStartDate)}
              </div>
            )}
            {proposal.estimatedEndDate && (
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                Estimated End: {formatDate(proposal.estimatedEndDate)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
