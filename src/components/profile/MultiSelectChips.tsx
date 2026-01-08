import { cn } from "@/lib/utils";

interface MultiSelectChipsProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label: string;
}

export const MultiSelectChips = ({ options, selected, onChange, label }: MultiSelectChipsProps) => {
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => toggleOption(option)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
              "border-2 focus:outline-none focus:ring-2 focus:ring-primary/50",
              selected.includes(option)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};
