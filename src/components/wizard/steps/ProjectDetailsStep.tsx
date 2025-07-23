'use client';

import { useFormContext } from 'react-hook-form';
import {
  sanitizeAddress,
  sanitizeNumber,
  sanitizeProjectName,
} from '../../../lib/input-sanitization';
import { ProposalFormData } from '../ProposalWizard';

export default function ProjectDetailsStep() {
  const {
    register,
    formState: { errors, isDirty, touchedFields },
    setValue,
  } = useFormContext<ProposalFormData>();

  const isFieldValid = (fieldName: keyof ProposalFormData) => {
    return !errors[fieldName] && touchedFields[fieldName];
  };

  const isFieldInvalid = (fieldName: keyof ProposalFormData) => {
    return !!errors[fieldName] && touchedFields[fieldName];
  };

  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-4">
          Project Details
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mb-6">
          Please provide the basic information about your glass project.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
              isFieldValid('projectName')
                ? 'border-green-300 bg-green-50'
                : isFieldInvalid('projectName')
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
            }`}
            placeholder="Enter project name"
            onChange={e => {
              const { sanitized } = sanitizeProjectName(e.target.value);
              setValue('projectName', sanitized);
            }}
          />
          {errors.projectName && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.projectName.message}
            </p>
          )}
          {isFieldValid('projectName') && (
            <p className="mt-1 text-sm text-green-600 flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Project name looks good!
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
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
              isFieldValid('projectType')
                ? 'border-green-300 bg-green-50'
                : isFieldInvalid('projectType')
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
            }`}
          >
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="industrial">Industrial</option>
          </select>
          {errors.projectType && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.projectType.message}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
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
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
              isFieldValid('projectAddress')
                ? 'border-green-300 bg-green-50'
                : isFieldInvalid('projectAddress')
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
            }`}
            placeholder="Enter full project address"
            onChange={e => {
              const { sanitized } = sanitizeAddress(e.target.value);
              setValue('projectAddress', sanitized);
            }}
          />
          {errors.projectAddress && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.projectAddress.message}
            </p>
          )}
          {isFieldValid('projectAddress') && (
            <p className="mt-1 text-sm text-green-600 flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Address looks good!
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
          <div className="relative">
            <input
              type="number"
              id="squareFootage"
              {...register('squareFootage', { valueAsNumber: true })}
              className={`w-full px-3 py-2 pr-12 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                isFieldValid('squareFootage')
                  ? 'border-green-300 bg-green-50'
                  : isFieldInvalid('squareFootage')
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
              }`}
              placeholder="0"
              min="1"
              onChange={e => {
                const { sanitized } = sanitizeNumber(e.target.value, {
                  min: 1,
                  max: 999999,
                  allowDecimals: true,
                  allowNegative: false,
                });
                if (sanitized !== null) {
                  setValue('squareFootage', sanitized);
                }
              }}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500 text-sm">sq ft</span>
            </div>
          </div>
          {errors.squareFootage && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.squareFootage.message}
            </p>
          )}
          {isFieldValid('squareFootage') && (
            <p className="mt-1 text-sm text-green-600 flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Square footage is valid!
            </p>
          )}
        </div>
      </div>

      {/* Help text */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Need help?</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Provide accurate project details to ensure we can give you the
                best possible proposal. Square footage should include all areas
                where glass work will be performed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
