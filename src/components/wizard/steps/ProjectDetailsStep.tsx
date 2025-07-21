'use client';

import { useFormContext } from 'react-hook-form';
import { ProposalFormData } from '../ProposalWizard';

export default function ProjectDetailsStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ProposalFormData>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Project Details
        </h2>
        <p className="text-gray-600 mb-6">
          Please provide the basic information about your glass project.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="projectName"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Project Name *
          </label>
          <input
            type="text"
            id="projectName"
            {...register('projectName')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter project name"
          />
          {errors.projectName && (
            <p className="mt-1 text-sm text-red-600">
              {errors.projectName.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="projectType"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Project Type *
          </label>
          <select
            id="projectType"
            {...register('projectType')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="industrial">Industrial</option>
          </select>
          {errors.projectType && (
            <p className="mt-1 text-sm text-red-600">
              {errors.projectType.message}
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="projectAddress"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Project Address *
          </label>
          <input
            type="text"
            id="projectAddress"
            {...register('projectAddress')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter full project address"
          />
          {errors.projectAddress && (
            <p className="mt-1 text-sm text-red-600">
              {errors.projectAddress.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="squareFootage"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Square Footage *
          </label>
          <input
            type="number"
            id="squareFootage"
            {...register('squareFootage', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter square footage"
            min="1"
          />
          {errors.squareFootage && (
            <p className="mt-1 text-sm text-red-600">
              {errors.squareFootage.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
