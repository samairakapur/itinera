import { motion } from 'framer-motion';

interface GuidedProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export const GuidedProgressBar = ({ currentStep, totalSteps }: GuidedProgressBarProps) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm px-4 py-4 border-b">
      <div className="max-w-lg mx-auto">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm font-medium text-primary">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
};
