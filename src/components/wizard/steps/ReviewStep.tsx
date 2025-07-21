'use client';

import { calculateProposalPrice } from '../../../lib/calculations/proposal-calculations';
import { ProposalFormData } from '../ProposalWizard';

interface ReviewStepProps {
  data: ProposalFormData;
}

export default function ReviewStep({ data }: ReviewStepProps) {
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
