'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onFinish: () => void;
  canNext: boolean;
  canPrevious: boolean;
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onFinish,
  canNext,
  canPrevious,
}: WizardNavigationProps) {
  return (
    <div className="flex items-center justify-between">
      {/* Progress indicator */}
      <div className="flex items-center space-x-2">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full ${
              index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="flex space-x-4">
        <button
          onClick={onPrevious}
          disabled={!canPrevious}
          className={`flex items-center px-4 py-2 rounded-md ${
            canPrevious
              ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </button>

        {currentStep === totalSteps - 1 ? (
          <button
            onClick={onFinish}
            className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            Finish
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={!canNext}
            className={`flex items-center px-4 py-2 rounded-md ${
              canNext
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </button>
        )}
      </div>
    </div>
  );
}
