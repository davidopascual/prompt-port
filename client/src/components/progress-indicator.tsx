import { WorkflowStep } from "@/types";

interface ProgressIndicatorProps {
  currentStep: WorkflowStep;
}

const steps = [
  { key: "upload" as const, label: "Upload", number: 1 },
  { key: "extract" as const, label: "Extract", number: 2 },
  { key: "review" as const, label: "Review", number: 3 },
  { key: "generate" as const, label: "Generate", number: 4 },
];

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const currentStepIndex = steps.findIndex(step => step.key === currentStep);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => {
          const isActive = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          return (
            <div key={step.key} className="flex items-center">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {step.number}
                </div>
                <span
                  className={`text-sm font-medium transition-colors ${
                    isActive ? "text-blue-600" : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 bg-slate-200 mx-4">
                  <div
                    className={`h-full bg-blue-600 transition-all duration-500 ${
                      index < currentStepIndex ? "w-full" : "w-0"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
