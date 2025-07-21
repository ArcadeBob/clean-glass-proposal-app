'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const proposalSchema = z.object({
  projectName: z.string().min(1, 'Project name is required'),
  projectAddress: z.string().min(1, 'Project address is required'),
  projectType: z.enum(['residential', 'commercial', 'industrial']),
  squareFootage: z.number().min(1, 'Square footage must be greater than 0'),
});

type ProposalFormData = z.infer<typeof proposalSchema>;

export default function NewProposalPage() {
  const [currentStep, setCurrentStep] = useState(1);

  const methods = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      projectName: '',
      projectAddress: '',
      projectType: 'residential',
      squareFootage: 0,
    },
  });

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = methods;

  const onSubmit = (data: ProposalFormData) => {
    console.log('Proposal data:', data);
    alert('Proposal created successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Glass Proposal
          </h1>
          <p className="text-gray-600">
            Follow the steps below to create a comprehensive glass proposal
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Project Details
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

            <div className="flex justify-end space-x-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                Create Proposal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
