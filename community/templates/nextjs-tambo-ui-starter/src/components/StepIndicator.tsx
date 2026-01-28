
'use client';

interface Step {
  id: number;
  name: string;
  icon: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1">
          <div className="flex flex-col items-center relative z-10">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-semibold transition-all ${
                step.id === currentStep
                  ? 'bg-blue-600 text-white shadow-lg scale-110'
                  : step.id < currentStep
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {step.id < currentStep ? '✓' : step.icon}
            </div>
            <div className="mt-2 text-sm font-medium text-center">
              <div
                className={`${
                  step.id === currentStep
                    ? 'text-blue-600'
                    : step.id < currentStep
                    ? 'text-green-600'
                    : 'text-slate-500'
                }`}
              >
                {step.name}
              </div>
            </div>
          </div>

          {index < steps.length - 1 && (
            <div className="flex-1 h-1 mx-4 relative" style={{ top: '-20px' }}>
              <div
                className={`h-full transition-all ${
                  step.id < currentStep ? 'bg-green-500' : 'bg-slate-200'
                }`}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}