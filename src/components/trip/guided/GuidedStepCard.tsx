import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuidedStepCardProps {
  label: string;
  description?: string;
  icon?: string;
  selected: boolean;
  onClick: () => void;
}

export const GuidedStepCard = ({
  label,
  description,
  icon,
  selected,
  onClick,
}: GuidedStepCardProps) => {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-4 relative',
        'hover:border-primary/50 hover:bg-primary/5',
        selected
          ? 'border-primary bg-primary/10 shadow-md'
          : 'border-border bg-card'
      )}
    >
      {/* Icon */}
      {icon && (
        <span className="text-2xl shrink-0">{icon}</span>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'font-semibold text-base transition-colors',
            selected ? 'text-primary' : 'text-foreground'
          )}
        >
          {label}
        </p>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            {description}
          </p>
        )}
      </div>

      {/* Selection indicator */}
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-200',
          selected
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted/50'
        )}
      >
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Check className="w-4 h-4" strokeWidth={3} />
          </motion.div>
        )}
      </div>
    </motion.button>
  );
};
