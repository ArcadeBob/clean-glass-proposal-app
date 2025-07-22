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
  isLoading?: boolean;
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onFinish,
  canNext,
  canPrevious,
  isLoading = false,
}: WizardNavigationProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
      {/* Progress indicator */}
      <div className="flex items-center space-x-2">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition-colors duration-200 ${
              index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-2">
          {currentStep + 1} / {totalSteps}
        </span>
      </div>

      {/* Navigation buttons */}
      <div className="flex space-x-2 sm:space-x-4 w-full sm:w-auto">
        <button
          onClick={onPrevious}
          disabled={!canPrevious || isLoading}
          className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex-1 sm:flex-none ${
            canPrevious && !isLoading
              ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">Prev</span>
        </button>

        {currentStep === totalSteps - 1 ? (
          <button
            onClick={onFinish}
            disabled={isLoading}
            className={`flex items-center justify-center px-4 sm:px-6 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex-1 sm:flex-none ${
              isLoading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span className="hidden sm:inline">Processing...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Finish</span>
                <span className="sm:hidden">Done</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={!canNext || isLoading}
            className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex-1 sm:flex-none ${
              canNext && !isLoading
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span className="hidden sm:inline">Loading...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="w-4 h-4 ml-1 sm:ml-2" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
