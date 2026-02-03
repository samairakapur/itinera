import { Car, Footprints, Train, Bus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TravelTimeCardProps {
  fromTitle: string;
  toTitle: string;
  minutes: number;
  mode: 'walk' | 'metro' | 'taxi' | 'bus';
  compact?: boolean;
}

const modeConfig = {
  walk: { 
    icon: Footprints, 
    label: 'Walk', 
    color: 'text-green-600 bg-green-50 border-green-200' 
  },
  metro: { 
    icon: Train, 
    label: 'Metro', 
    color: 'text-blue-600 bg-blue-50 border-blue-200' 
  },
  taxi: { 
    icon: Car, 
    label: 'Taxi', 
    color: 'text-amber-600 bg-amber-50 border-amber-200' 
  },
  bus: { 
    icon: Bus, 
    label: 'Bus', 
    color: 'text-purple-600 bg-purple-50 border-purple-200' 
  },
};

export const TravelTimeCard = ({ 
  fromTitle, 
  toTitle, 
  minutes, 
  mode,
  compact = true 
}: TravelTimeCardProps) => {
  const config = modeConfig[mode];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 mx-6">
        <div className="flex-1 h-px bg-border" />
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium",
          config.color
        )}>
          <Icon className="w-3 h-3" />
          <span>{minutes} min {config.label.toLowerCase()}</span>
        </div>
        <div className="flex-1 h-px bg-border" />
      </div>
    );
  }

  return (
    <div className={cn(
      "mx-6 my-2 p-3 rounded-lg border",
      config.color
    )}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-white/50">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{minutes} min</span>
            <span className="text-xs opacity-80">via {config.label}</span>
          </div>
          <p className="text-xs opacity-70 truncate">
            {fromTitle} → {toTitle}
          </p>
        </div>
      </div>
    </div>
  );
};
