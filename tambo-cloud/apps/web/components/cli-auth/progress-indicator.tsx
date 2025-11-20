type ProgressIndicatorProps = {
  steps: string[];
  currentStep: string;
  onStepClick?: (step: string) => void;
};

export function ProgressIndicator({
  steps,
  currentStep,
  onStepClick,
}: ProgressIndicatorProps) {
  return (
    <div className="flex mb-8 px-2 mx-auto">
      {steps.map((step, i) => {
        const isPreviousStep = i < steps.indexOf(currentStep);
        const isClickable = isPreviousStep && onStepClick;

        return (
          <div key={step} className="flex flex-col items-center gap-2 p-4">
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${
                  step === currentStep
                    ? "bg-primary text-primary-foreground"
                    : isPreviousStep
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }
                ${isClickable ? "cursor-pointer hover:bg-primary/30" : ""}
              `}
              onClick={isClickable ? () => onStepClick(step) : undefined}
              role={isClickable ? "button" : undefined}
            >
              {i + 1}
            </div>
            <div
              className={`text-xs font-medium capitalize ${
                isClickable
                  ? "text-primary cursor-pointer hover:underline"
                  : "text-muted-foreground"
              }`}
              onClick={isClickable ? () => onStepClick(step) : undefined}
            >
              {step}
            </div>
          </div>
        );
      })}
    </div>
  );
}
