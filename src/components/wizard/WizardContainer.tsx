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
  const [isLoading, setIsLoading] = useState(false);

  const steps = React.Children.toArray(children).filter(
    child => React.isValidElement(child) && child.type === WizardStep
  );

  // If no WizardStep components found, render children directly
  if (steps.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 sm:py-8">{children}</div>
    );
  }

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setIsLoading(true);
      // Simulate validation delay
      await new Promise(resolve => setTimeout(resolve, 300));
      setCurrentStep(currentStep + 1);
      setIsLoading(false);
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

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      await onComplete?.(formData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 sm:px-8">
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Proposal Wizard
            </h1>
            <p className="text-blue-100 mt-1">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>

          {/* Navigation */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200">
            <WizardNavigation
              currentStep={currentStep}
              totalSteps={steps.length}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onFinish={handleFinish}
              canNext={currentStep < steps.length - 1}
              canPrevious={currentStep > 0}
              isLoading={isLoading}
            />
          </div>

          {/* Content */}
          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading...</span>
              </div>
            ) : (
              <div className="min-h-[400px]">
                {React.cloneElement(steps[currentStep] as React.ReactElement, {
                  onComplete: handleStepComplete,
                  data: formData,
                })}
              </div>
            )}
          </div>

          {/* Progress indicator */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>
                {Math.round(((currentStep + 1) / steps.length) * 100)}%
              </span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
