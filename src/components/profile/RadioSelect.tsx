import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface RadioSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export const RadioSelect = ({ options, value, onChange, label }: RadioSelectProps) => {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <RadioGroup value={value} onValueChange={onChange} className="grid gap-2">
        {options.map((option) => (
          <div key={option} className="flex items-center space-x-3">
            <RadioGroupItem value={option} id={option} />
            <Label htmlFor={option} className="cursor-pointer text-foreground">
              {option}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};
