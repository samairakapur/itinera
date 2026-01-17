import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface GuidedSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  labels?: { value: number; label: string }[];
}

export const GuidedSlider = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  labels = [],
}: GuidedSliderProps) => {
  return (
    <div className="w-full max-w-md mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="py-8"
      >
        {/* Current value display */}
        <div className="text-center mb-6">
          <span className="text-4xl font-bold text-primary">{value}</span>
        </div>

        {/* Slider */}
        <Slider
          value={[value]}
          onValueChange={(vals) => onChange(vals[0])}
          min={min}
          max={max}
          step={step}
          className="w-full"
        />

        {/* Labels */}
        {labels.length > 0 && (
          <div className="flex justify-between mt-4">
            {labels.map((label) => (
              <button
                key={label.value}
                onClick={() => onChange(label.value)}
                className={cn(
                  'text-sm transition-colors',
                  value === label.value
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label.label}
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};
