type ProgressIndicatorProps = {
  steps: string[];
  currentStep: string;
};

export function ProgressIndicator({
  steps,
  currentStep,
}: ProgressIndicatorProps) {
  return (
    <div className="flex justify-between mb-8 px-2">
      {steps.map((step, i) => (
        <div key={step} className="flex flex-col items-center gap-2">
          <div
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${
                step === currentStep
                  ? "bg-primary text-primary-foreground"
                  : i < steps.indexOf(currentStep)
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              }
            `}
          >
            {i + 1}
          </div>
          <div className="text-xs font-medium text-muted-foreground capitalize">
            {step}
          </div>
        </div>
      ))}
    </div>
  );
}
