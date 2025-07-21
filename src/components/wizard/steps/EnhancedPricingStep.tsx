'use client';

import { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { calculateEnhancedProposalPrice } from '../../../lib/calculations/enhanced-proposal-calculations';
import { ProposalFormData } from '../ProposalWizard';

interface RiskFactor {
  id: string;
  name: string;
  description: string;
  categoryName: string;
  dataType: string;
  options?: string[];
  minValue?: number;
  maxValue?: number;
  defaultValue?: any;
}

interface RiskCategory {
  id: string;
  name: string;
  description: string;
  weight: number;
  factors: RiskFactor[];
}

export default function EnhancedPricingStep() {
  const {
    register,
    formState: { errors },
    control,
    setValue,
    watch,
  } = useFormContext<ProposalFormData>();

  const [riskCategories, setRiskCategories] = useState<RiskCategory[]>([]);
  const [riskFactorInputs, setRiskFactorInputs] = useState<
    Record<string, { value: any; notes?: string }>
  >({});
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      'region',
      'materialType',
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
    region,
    materialType,
  ] = watchedValues;

  // Load risk factors on component mount
  useEffect(() => {
    const loadRiskFactors = async () => {
      try {
        const response = await fetch('/api/calculate/enhanced');
        if (response.ok) {
          const data = await response.json();
          setRiskCategories(data.data.categories || []);
        }
      } catch (error) {
        console.error('Error loading risk factors:', error);
      }
    };

    loadRiskFactors();
  }, []);

  // Calculate enhanced price when inputs change
  useEffect(() => {
    const calculatePrice = async () => {
      if (!squareFootage || squareFootage <= 0) return;

      setIsLoading(true);
      try {
        const result = await calculateEnhancedProposalPrice({
          squareFootage: squareFootage || 0,
          glassType: glassType || 'clear',
          framingType: framingType || 'aluminum',
          hardwareType: hardwareType || 'standard',
          quantity: quantity || 1,
          overheadPercentage: overheadPercentage || 15,
          profitMargin: profitMargin || 20,
          riskFactorInputs:
            Object.keys(riskFactorInputs).length > 0
              ? riskFactorInputs
              : undefined,
          riskFactor: riskFactor || 5,
          region: region || '',
          materialType: materialType || '',
        });

        setCalculationResult(result);
      } catch (error) {
        console.error('Error calculating enhanced price:', error);
      } finally {
        setIsLoading(false);
      }
    };

    calculatePrice();
  }, [
    squareFootage,
    glassType,
    framingType,
    hardwareType,
    quantity,
    overheadPercentage,
    profitMargin,
    riskFactor,
    region,
    materialType,
    riskFactorInputs,
  ]);

  const handleRiskFactorChange = (
    factorName: string,
    value: any,
    notes?: string
  ) => {
    setRiskFactorInputs(prev => ({
      ...prev,
      [factorName]: { value, notes },
    }));
  };

  const renderRiskFactorInput = (factor: RiskFactor) => {
    const currentValue = riskFactorInputs[factor.name]?.value;
    const currentNotes = riskFactorInputs[factor.name]?.notes;

    switch (factor.dataType) {
      case 'CATEGORICAL':
        return (
          <select
            value={currentValue || ''}
            onChange={e => handleRiskFactorChange(factor.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select option...</option>
            {factor.options?.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'NUMERIC':
      case 'PERCENTAGE':
        return (
          <input
            type="number"
            value={currentValue || ''}
            onChange={e =>
              handleRiskFactorChange(
                factor.name,
                parseFloat(e.target.value) || 0
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={`${factor.minValue || 0} - ${factor.maxValue || 100}`}
            min={factor.minValue}
            max={factor.maxValue}
            step="0.1"
          />
        );

      case 'BOOLEAN':
        return (
          <select
            value={currentValue?.toString() || ''}
            onChange={e =>
              handleRiskFactorChange(factor.name, e.target.value === 'true')
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select...</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );

      default:
        return (
          <input
            type="text"
            value={currentValue || ''}
            onChange={e => handleRiskFactorChange(factor.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter value..."
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Enhanced Pricing & Risk Assessment
        </h2>
        <p className="text-gray-600 mb-6">
          Configure pricing parameters and assess project risks for accurate
          cost estimation.
        </p>
      </div>

      {/* Basic Pricing Configuration */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Pricing Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          </div>

          <div>
            <label
              htmlFor="riskFactor"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Legacy Risk Factor (Fallback)
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
            <p className="mt-1 text-xs text-gray-500">
              Used if enhanced risk assessment is not available
            </p>
          </div>
        </div>
      </div>

      {/* Market Analysis Configuration */}
      <div className="bg-yellow-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-900 mb-4">
          Market Analysis
        </h3>
        <p className="text-yellow-700 mb-4">
          Provide region and material information for market-based pricing
          adjustments.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="region"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Region
            </label>
            <select
              id="region"
              {...register('region')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select region...</option>
              <option value="Northeast">Northeast</option>
              <option value="Midwest">Midwest</option>
              <option value="South">South</option>
              <option value="West">West</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Used for regional pricing adjustments and labor availability
            </p>
          </div>

          <div>
            <label
              htmlFor="materialType"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Primary Material Type
            </label>
            <select
              id="materialType"
              {...register('materialType')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select material...</option>
              <option value="glass">Glass</option>
              <option value="aluminum">Aluminum</option>
              <option value="steel">Steel</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Used for material cost trend analysis
            </p>
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          Risk Assessment
        </h3>
        <p className="text-blue-700 mb-4">
          Assess project risks to calculate accurate contingency costs. Leave
          blank to use default values.
        </p>

        {riskCategories.map(category => (
          <div key={category.id} className="mb-6">
            <h4 className="text-md font-semibold text-blue-800 mb-3">
              {category.name} (Weight: {category.weight}%)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.factors.map(factor => (
                <div key={factor.id} className="bg-white p-4 rounded border">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {factor.name}
                  </label>
                  {renderRiskFactorInput(factor)}
                  {factor.description && (
                    <p className="mt-1 text-xs text-gray-500">
                      {factor.description}
                    </p>
                  )}
                  <textarea
                    placeholder="Additional notes..."
                    value={riskFactorInputs[factor.name]?.notes || ''}
                    onChange={e =>
                      handleRiskFactorChange(
                        factor.name,
                        riskFactorInputs[factor.name]?.value,
                        e.target.value
                      )
                    }
                    className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Price Preview */}
      <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-lg font-semibold text-green-900 mb-4">
          Enhanced Proposal Price
        </h3>

        {isLoading ? (
          <div className="text-green-700">Calculating...</div>
        ) : calculationResult ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-green-700 font-medium">Base Cost:</span>
                <span className="ml-2 text-green-900">
                  ${calculationResult.baseCost.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-green-700 font-medium">
                  With Overhead:
                </span>
                <span className="ml-2 text-green-900">
                  ${calculationResult.withOverhead.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-green-700 font-medium">Contingency:</span>
                <span className="ml-2 text-green-900">
                  ${calculationResult.contingencyAmount.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-green-700 font-medium">Final Price:</span>
                <span className="ml-2 text-green-900 font-bold text-lg">
                  ${calculationResult.finalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {calculationResult.riskAssessment && (
              <div className="mt-4 p-4 bg-blue-100 rounded border">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  Risk Assessment Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-blue-700 font-medium">
                      Risk Score:
                    </span>
                    <span className="ml-2 text-blue-900">
                      {calculationResult.riskAssessment.totalRiskScore.toFixed(
                        1
                      )}
                      /100
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">
                      Risk Level:
                    </span>
                    <span className="ml-2 text-blue-900">
                      {calculationResult.riskAssessment.riskLevel}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">
                      Contingency Rate:
                    </span>
                    <span className="ml-2 text-blue-900">
                      {(
                        calculationResult.riskAssessment.contingencyRate * 100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-blue-700 font-medium">
                    Cost per SF:
                  </span>
                  <span className="ml-2 text-blue-900">
                    ${calculationResult.costPerSquareFoot.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {calculationResult.marketAnalysis && (
              <div className="mt-4 p-4 bg-yellow-100 rounded border">
                <h4 className="text-sm font-semibold text-yellow-900 mb-2">
                  Market Analysis Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-yellow-700 font-medium">
                      Material Trend:
                    </span>
                    <span className="ml-2 text-yellow-900">
                      {(
                        calculationResult.marketAnalysis.materialCostTrend * 100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div>
                    <span className="text-yellow-700 font-medium">
                      Labor Availability:
                    </span>
                    <span className="ml-2 text-yellow-900">
                      {calculationResult.marketAnalysis.laborAvailabilityIndex}
                      /100
                    </span>
                  </div>
                  <div>
                    <span className="text-yellow-700 font-medium">
                      Regional Adjustment:
                    </span>
                    <span className="ml-2 text-yellow-900">
                      {(
                        (calculationResult.marketAnalysis.regionalAdjustment -
                          1) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div>
                    <span className="text-yellow-700 font-medium">
                      Market Condition:
                    </span>
                    <span className="ml-2 text-yellow-900">
                      {calculationResult.marketAnalysis.marketConditionScore}
                      /100
                    </span>
                  </div>
                </div>
                {calculationResult.marketAnalysis.notes.length > 0 && (
                  <div className="mt-2 text-xs text-yellow-700">
                    <span className="font-medium">Notes:</span>
                    <ul className="mt-1 list-disc list-inside">
                      {calculationResult.marketAnalysis.notes.map(
                        (note: string, index: number) => (
                          <li key={index}>{note}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {calculationResult.contingencyRecommendation && (
              <div className="mt-4 p-4 bg-orange-100 rounded border">
                <h4 className="text-sm font-semibold text-orange-900 mb-2">
                  Contingency Recommendation
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-orange-700 font-medium">
                      Recommended Rate:
                    </span>
                    <span className="ml-2 text-orange-900">
                      {(
                        calculationResult.contingencyRecommendation
                          .recommendedContingencyRate * 100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-orange-700 font-medium">
                      Explanation:
                    </span>
                    <span className="ml-2 text-orange-900">
                      {calculationResult.contingencyRecommendation.explanation}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-orange-700">
                  <span className="font-medium">Recommendations:</span>
                  <ul className="mt-1 list-disc list-inside">
                    {calculationResult.contingencyRecommendation.recommendations.map(
                      (rec: string, idx: number) => (
                        <li key={idx}>{rec}</li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            )}

            <div className="mt-4 text-xs text-green-600">
              * This is an enhanced estimate based on current specifications and
              risk assessment. Final price may vary.
            </div>
          </div>
        ) : (
          <div className="text-green-700">
            Enter project details to see pricing calculation
          </div>
        )}
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
