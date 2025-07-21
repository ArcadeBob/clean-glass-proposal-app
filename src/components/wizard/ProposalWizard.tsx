'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { WizardContainer, WizardNavigation } from './';
import { StepIndicator } from './StepIndicator';
import GlassSpecificationsStep from './steps/GlassSpecificationsStep';
import PricingStep from './steps/PricingStep';
import ProjectDetailsStep from './steps/ProjectDetailsStep';
import ReviewStep from './steps/ReviewStep';

// Combined schema for all wizard steps
const proposalSchema = z.object({
  // Project Details
  projectName: z.string().min(1, 'Project name is required'),
  projectAddress: z.string().min(1, 'Project address is required'),
  projectType: z.enum(['residential', 'commercial', 'industrial']),
  squareFootage: z.number().min(1, 'Square footage must be greater than 0'),

  // Glass Specifications
  glassType: z.enum(['clear', 'tinted', 'reflective', 'low_e', 'tempered']),
  framingType: z.enum(['aluminum', 'steel', 'wood', 'vinyl']),
  hardwareType: z.enum(['standard', 'premium', 'custom']),
  quantity: z.number().min(1, 'Quantity must be at least 1'),

  // Pricing
  overheadPercentage: z.number().min(0).max(100),
  profitMargin: z.number().min(0).max(100),
  riskFactor: z.number().min(0).max(50),

  // Additional details
  notes: z.string().optional(),
});

export type ProposalFormData = z.infer<typeof proposalSchema>;

const steps = [
  { id: 1, title: 'Project Details', description: 'Basic project information' },
  {
    id: 2,
    title: 'Glass Specifications',
    description: 'Glass type and framing details',
  },
  { id: 3, title: 'Pricing', description: 'Cost calculations and margins' },
  { id: 4, title: 'Review', description: 'Review and finalize proposal' },
];

export default function ProposalWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      projectName: '',
      projectAddress: '',
      projectType: 'residential',
      squareFootage: 0,
      glassType: 'clear',
      framingType: 'aluminum',
      hardwareType: 'standard',
      quantity: 1,
      overheadPercentage: 15,
      profitMargin: 20,
      riskFactor: 5,
      notes: '',
    },
    mode: 'onChange',
  });

  const { handleSubmit, trigger, getValues } = methods;

  const nextStep = async () => {
    const isValid = await trigger();
    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: ProposalFormData) => {
    setIsSubmitting(true);
    try {
      console.log('Proposal data:', data);
      // TODO: Submit to API
      alert('Proposal created successfully!');
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert('Error creating proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <ProjectDetailsStep />;
      case 2:
        return <GlassSpecificationsStep />;
      case 3:
        return <PricingStep />;
      case 4:
        return <ReviewStep data={getValues()} />;
      default:
        return <ProjectDetailsStep />;
    }
  };

  return (
    <FormProvider {...methods}>
      <WizardContainer>
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Glass Proposal
            </h1>
            <p className="text-gray-600">
              Follow the steps below to create a comprehensive glass proposal
            </p>
          </div>

          <StepIndicator
            steps={steps}
            currentStep={currentStep}
            onStepClick={(step: number) => setCurrentStep(step)}
          />

          <div className="mt-8">{renderStep()}</div>

          <WizardNavigation
            currentStep={currentStep}
            totalSteps={steps.length}
            onNext={nextStep}
            onPrevious={prevStep}
            onFinish={handleSubmit(onSubmit)}
            canNext={currentStep < steps.length}
            canPrevious={currentStep > 1}
          />
        </div>
      </WizardContainer>
    </FormProvider>
  );
}
