'use client';

import { useState } from 'react';
import { calculateProposalPrice } from '../../../lib/calculations/proposal-calculations';
import { ProposalFormData } from '../ProposalWizard';

interface ReviewStepProps {
  data: ProposalFormData;
}

export default function ReviewStep({ data }: ReviewStepProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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

  const formatProjectType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatGlassType = (type: string) => {
    const types = {
      clear: 'Clear Glass',
      tinted: 'Tinted Glass',
      reflective: 'Reflective Glass',
      low_e: 'Low-E Glass',
      tempered: 'Tempered Glass',
    };
    return types[type as keyof typeof types] || type;
  };

  const formatFramingType = (type: string) => {
    const types = {
      aluminum: 'Aluminum',
      steel: 'Steel',
      wood: 'Wood',
      vinyl: 'Vinyl',
    };
    return types[type as keyof typeof types] || type;
  };

  const formatHardwareType = (type: string) => {
    const types = {
      standard: 'Standard',
      premium: 'Premium',
      custom: 'Custom',
    };
    return types[type as keyof typeof types] || type;
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const response = await fetch('/api/proposals/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `proposal-${data.projectName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Review Proposal
        </h2>
        <p className="text-gray-600 mb-6">
          Please review all the details before finalizing your proposal.
        </p>
      </div>

      {/* Project Details Section */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Project Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-gray-600">
              Project Name:
            </span>
            <p className="text-gray-900">{data.projectName}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600">
              Project Type:
            </span>
            <p className="text-gray-900">
              {formatProjectType(data.projectType)}
            </p>
          </div>
          <div className="md:col-span-2">
            <span className="text-sm font-medium text-gray-600">
              Project Address:
            </span>
            <p className="text-gray-900">{data.projectAddress}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600">
              Square Footage:
            </span>
            <p className="text-gray-900">
              {data.squareFootage.toLocaleString()} sq ft
            </p>
          </div>
        </div>
      </div>

      {/* Glass Specifications Section */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Glass Specifications
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-gray-600">
              Glass Type:
            </span>
            <p className="text-gray-900">{formatGlassType(data.glassType)}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600">
              Framing Type:
            </span>
            <p className="text-gray-900">
              {formatFramingType(data.framingType)}
            </p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600">
              Hardware Type:
            </span>
            <p className="text-gray-900">
              {formatHardwareType(data.hardwareType)}
            </p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600">Quantity:</span>
            <p className="text-gray-900">{data.quantity} units</p>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Pricing Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-sm font-medium text-gray-600">
              Overhead Percentage:
            </span>
            <p className="text-gray-900">{data.overheadPercentage}%</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600">
              Profit Margin:
            </span>
            <p className="text-gray-900">{data.profitMargin}%</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600">
              Risk Factor:
            </span>
            <p className="text-gray-900">{data.riskFactor}%</p>
          </div>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="bg-green-50 p-6 rounded-lg border border-green-200">
        <h3 className="text-lg font-semibold text-green-900 mb-4">
          Price Breakdown
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-green-700">Base Cost:</span>
            <span className="text-green-900 font-medium">
              ${finalPrice.baseCost.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-700">
              With Overhead ({data.overheadPercentage}%):
            </span>
            <span className="text-green-900 font-medium">
              ${finalPrice.withOverhead.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-700">
              Profit Margin ({data.profitMargin}%):
            </span>
            <span className="text-green-900 font-medium">
              $
              {((finalPrice.withOverhead * data.profitMargin) / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-700">
              Risk Factor ({data.riskFactor}%):
            </span>
            <span className="text-green-900 font-medium">
              ${((finalPrice.withOverhead * data.riskFactor) / 100).toFixed(2)}
            </span>
          </div>
          <div className="border-t border-green-200 pt-3">
            <div className="flex justify-between">
              <span className="text-green-900 font-bold text-lg">
                Final Price:
              </span>
              <span className="text-green-900 font-bold text-lg">
                ${finalPrice.finalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      {data.notes && (
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Additional Notes
          </h3>
          <p className="text-blue-800 whitespace-pre-wrap">{data.notes}</p>
        </div>
      )}

      {/* PDF Download Button */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          Download Proposal
        </h3>
        <p className="text-blue-800 mb-4">
          Generate a professional PDF version of this proposal to share with
          your client.
        </p>
        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2"
        >
          {isGeneratingPDF ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Download PDF</span>
            </>
          )}
        </button>
      </div>

      {/* Confirmation */}
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Ready to Submit
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Please review all information carefully. Once submitted, this
                proposal will be saved to your account and can be shared with
                clients.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
