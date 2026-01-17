import { useState, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { Calendar as CalendarIcon, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DateSelectionStepProps {
  cityName: string;
  numDays: number;
  onBack: () => void;
  onSave: (startDate: Date, endDate: Date) => void;
  isSaving: boolean;
}

export const DateSelectionStep = ({
  cityName,
  numDays,
  onBack,
  onSave,
  isSaving,
}: DateSelectionStepProps) => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);

  const endDate = useMemo(() => {
    if (!startDate) return undefined;
    return addDays(startDate, numDays - 1);
  }, [startDate, numDays]);

  const handleSave = () => {
    if (startDate && endDate) {
      onSave(startDate, endDate);
    }
  };

  return (
    <Card className="border-0 shadow-card">
      <CardHeader className="text-center pb-2">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <CalendarIcon className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="font-display text-xl">Select Your Travel Dates</CardTitle>
        <CardDescription>
          Choose when you're traveling to {cityName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Picker */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pick a start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date Display */}
          {startDate && endDate && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">End Date</label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-muted border">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{format(endDate, "PPP")}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {numDays} day{numDays !== 1 ? 's' : ''} trip
              </p>
            </div>
          )}
        </div>

        {/* Trip Summary */}
        {startDate && endDate && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
            <h4 className="font-semibold text-foreground mb-2">Trip Summary</h4>
            <p className="text-sm text-muted-foreground">
              <strong>{cityName}</strong> • {format(startDate, "MMM d")} – {format(endDate, "MMM d, yyyy")}
            </p>
            <p className="text-sm text-muted-foreground">
              {numDays} day{numDays !== 1 ? 's' : ''} of adventure awaits!
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1"
            disabled={isSaving}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleSave}
            disabled={!startDate || isSaving}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Trip
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
