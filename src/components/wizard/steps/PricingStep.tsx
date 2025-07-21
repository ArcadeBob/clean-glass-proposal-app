'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { calculateProposalPrice } from '../../../lib/calculations/proposal-calculations';
import { ProposalFormData } from '../ProposalWizard';

export default function PricingStep() {
  const {
    register,
    formState: { errors },
    control,
  } = useFormContext<ProposalFormData>();

  // Watch form values for real-time calculation
  const watchedValues = useWatch({
    control,
    name: [
      'squareFootage',
      'glassType',
      'framingType',
      'hardwareType',
      'quantity',
      'overheadPercentage',
      'profitMargin',
      'riskFactor',
    ],
  });

  const [
    squareFootage,
    glassType,
    framingType,
    hardwareType,
    quantity,
    overheadPercentage,
    profitMargin,
    riskFactor,
  ] = watchedValues;

  // Calculate estimated price
  const estimatedPrice = calculateProposalPrice({
    squareFootage: squareFootage || 0,
    glassType: glassType || 'clear',
    framingType: framingType || 'aluminum',
    hardwareType: hardwareType || 'standard',
    quantity: quantity || 1,
    overheadPercentage: overheadPercentage || 15,
    profitMargin: profitMargin || 20,
    riskFactor: riskFactor || 5,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Pricing Configuration
        </h2>
        <p className="text-gray-600 mb-6">
          Configure the pricing parameters for your proposal calculation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="overheadPercentage"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Overhead Percentage *
          </label>
          <div className="relative">
            <input
              type="number"
              id="overheadPercentage"
              {...register('overheadPercentage', { valueAsNumber: true })}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="15"
              min="0"
              max="100"
              step="0.1"
            />
            <span className="absolute right-3 top-2 text-gray-500">%</span>
          </div>
          {errors.overheadPercentage && (
            <p className="mt-1 text-sm text-red-600">
              {errors.overheadPercentage.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Standard overhead costs (rent, utilities, insurance, etc.)
          </p>
        </div>

        <div>
          <label
            htmlFor="profitMargin"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Profit Margin *
          </label>
          <div className="relative">
            <input
              type="number"
              id="profitMargin"
              {...register('profitMargin', { valueAsNumber: true })}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="20"
              min="0"
              max="100"
              step="0.1"
            />
            <span className="absolute right-3 top-2 text-gray-500">%</span>
          </div>
          {errors.profitMargin && (
            <p className="mt-1 text-sm text-red-600">
              {errors.profitMargin.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Desired profit margin for the project
          </p>
        </div>

        <div>
          <label
            htmlFor="riskFactor"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Risk Factor *
          </label>
          <div className="relative">
            <input
              type="number"
              id="riskFactor"
              {...register('riskFactor', { valueAsNumber: true })}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="5"
              min="0"
              max="50"
              step="0.1"
            />
            <span className="absolute right-3 top-2 text-gray-500">%</span>
          </div>
          {errors.riskFactor && (
            <p className="mt-1 text-sm text-red-600">
              {errors.riskFactor.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Additional risk factor for project complexity
          </p>
        </div>
      </div>

      {/* Price Preview */}
      <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-lg font-semibold text-green-900 mb-4">
          Estimated Proposal Price
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-green-700 font-medium">Base Cost:</span>
            <span className="ml-2 text-green-900">
              ${estimatedPrice.baseCost.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-green-700 font-medium">With Overhead:</span>
            <span className="ml-2 text-green-900">
              ${estimatedPrice.withOverhead.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-green-700 font-medium">Final Price:</span>
            <span className="ml-2 text-green-900 font-bold text-lg">
              ${estimatedPrice.finalPrice.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="mt-4 text-xs text-green-600">
          * This is an estimate based on current specifications. Final price may
          vary.
        </div>
      </div>

      {/* Additional Notes */}
      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Additional Notes
        </label>
        <textarea
          id="notes"
          {...register('notes')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Add any additional notes or special requirements..."
        />
      </div>
    </div>
  );
}
