'use client';

import React, { useState } from 'react';
import { WizardNavigation } from './WizardNavigation';
import { WizardStep } from './WizardStep';

interface WizardContainerProps {
  children: React.ReactNode;
  onComplete?: (data: any) => void;
}

export default function WizardContainer({
  children,
  onComplete,
}: WizardContainerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});

  const steps = React.Children.toArray(children).filter(
    child => React.isValidElement(child) && child.type === WizardStep
  );

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepComplete = (stepData: any) => {
    setFormData({ ...formData, ...stepData });
  };

  const handleFinish = () => {
    onComplete?.(formData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <WizardNavigation
          currentStep={currentStep}
          totalSteps={steps.length}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onFinish={handleFinish}
          canNext={currentStep < steps.length - 1}
          canPrevious={currentStep > 0}
        />

        <div className="mt-8">
          {React.cloneElement(steps[currentStep] as React.ReactElement, {
            onComplete: handleStepComplete,
            data: formData,
          })}
        </div>
      </div>
    </div>
  );
}
