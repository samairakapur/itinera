import { Slider } from "@/components/ui/slider";

interface SliderInputProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  labels?: string[];
  min?: number;
  max?: number;
  step?: number;
}

export const SliderInput = ({ 
  value, 
  onChange, 
  label, 
  labels = [],
  min = 0,
  max = 100,
  step = 1
}: SliderInputProps) => {
  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      {labels.length > 0 && (
        <div className="flex justify-between text-xs text-muted-foreground">
          {labels.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
};
