'use client';

import React from 'react';

interface WizardStepProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  onComplete?: (data: any) => void;
  data?: any;
}

export function WizardStep({ title, description, children }: WizardStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {description && <p className="mt-2 text-gray-600">{description}</p>}
      </div>

      <div className="space-y-4">{children}</div>
    </div>
  );
}
