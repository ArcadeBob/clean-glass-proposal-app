'use client';

import { useFormContext } from 'react-hook-form';
import { ProposalFormData } from '../ProposalWizard';

export default function GlassSpecificationsStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ProposalFormData>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Glass Specifications
        </h2>
        <p className="text-gray-600 mb-6">
          Select the glass type, framing, and hardware specifications for your
          project.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="glassType"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Glass Type *
          </label>
          <select
            id="glassType"
            {...register('glassType')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="clear">Clear Glass</option>
            <option value="tinted">Tinted Glass</option>
            <option value="reflective">Reflective Glass</option>
            <option value="low_e">Low-E Glass</option>
            <option value="tempered">Tempered Glass</option>
          </select>
          {errors.glassType && (
            <p className="mt-1 text-sm text-red-600">
              {errors.glassType.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="framingType"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Framing Type *
          </label>
          <select
            id="framingType"
            {...register('framingType')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="aluminum">Aluminum</option>
            <option value="steel">Steel</option>
            <option value="wood">Wood</option>
            <option value="vinyl">Vinyl</option>
          </select>
          {errors.framingType && (
            <p className="mt-1 text-sm text-red-600">
              {errors.framingType.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="hardwareType"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Hardware Type *
          </label>
          <select
            id="hardwareType"
            {...register('hardwareType')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="custom">Custom</option>
          </select>
          {errors.hardwareType && (
            <p className="mt-1 text-sm text-red-600">
              {errors.hardwareType.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="quantity"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Quantity *
          </label>
          <input
            type="number"
            id="quantity"
            {...register('quantity', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter quantity"
            min="1"
          />
          {errors.quantity && (
            <p className="mt-1 text-sm text-red-600">
              {errors.quantity.message}
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-medium text-blue-900 mb-2">
          Glass Type Information
        </h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>
            <strong>Clear Glass:</strong> Standard transparent glass for general
            applications
          </p>
          <p>
            <strong>Tinted Glass:</strong> Colored glass for privacy and solar
            control
          </p>
          <p>
            <strong>Reflective Glass:</strong> Mirror-like finish for privacy
            and aesthetics
          </p>
          <p>
            <strong>Low-E Glass:</strong> Energy-efficient glass with low
            emissivity coating
          </p>
          <p>
            <strong>Tempered Glass:</strong> Safety glass that breaks into small
            pieces
          </p>
        </div>
      </div>
    </div>
  );
}
