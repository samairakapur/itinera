/**
 * PreviewFlightPanel — in-memory flight entry for the pre-save itinerary view.
 *
 * Unlike FlightDetailsDialog (which requires a saved itinerary_id), this
 * component keeps flights in React state.  When the user confirms, the parent
 * (NewTrip.tsx) re-generates the itinerary with the flight constraints baked
 * in, and passes the flights array to useCreateItinerary on save so they get
 * persisted to the DB.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Plane,
  Plus,
  Trash2,
  RefreshCw,
  ChevronDown,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

export interface PreviewFlight {
  id: string;
  airline: string;
  flight_number: string;
  departure_city: string;
  arrival_city: string;
  origin_iata: string;
  destination_iata: string;
  departure_date: string;
  departure_time: string;
  arrival_date: string;
  arrival_time: string;
  is_international: boolean;
}

interface PreviewFlightPanelProps {
  flights: PreviewFlight[];
  onChange: (flights: PreviewFlight[]) => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

const emptyFlight = (): Omit<PreviewFlight, 'id'> => ({
  airline: '',
  flight_number: '',
  departure_city: '',
  arrival_city: '',
  origin_iata: '',
  destination_iata: '',
  departure_date: '',
  departure_time: '',
  arrival_date: '',
  arrival_time: '',
  is_international: false,
});

export const PreviewFlightPanel = ({
  flights,
  onChange,
  onRegenerate,
  isRegenerating,
}: PreviewFlightPanelProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(emptyFlight());

  const handleField = (field: keyof Omit<PreviewFlight, 'id'>, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAdd = () => {
    if (!form.departure_city || !form.arrival_city || !form.departure_date || !form.arrival_date) {
      toast.error('Please fill in the required fields: From city, To city, Departure date, Arrival date');
      return;
    }
    const newFlight: PreviewFlight = {
      ...form,
      id: `preview-${Date.now()}`,
    };
    const updated = [...flights, newFlight];
    onChange(updated);
    setForm(emptyFlight());
    setIsAdding(false);
    toast.success('Flight added — regenerating itinerary with flight times…');
    // Trigger regeneration immediately after adding
    setTimeout(onRegenerate, 100);
  };

  const handleRemove = (id: string) => {
    const updated = flights.filter(f => f.id !== id);
    onChange(updated);
    if (updated.length === 0) {
      toast.info('All flights removed. Regenerate to refresh the itinerary.');
    }
  };

  const handleCancel = () => {
    setForm(emptyFlight());
    setIsAdding(false);
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Flight Details</span>
            {flights.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {flights.length} flight{flights.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          {flights.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs h-7 text-primary"
              onClick={onRegenerate}
              disabled={isRegenerating}
            >
              <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
              Re-generate
            </Button>
          )}
        </div>

        {/* Saved flights */}
        {flights.map((f, idx) => (
          <div
            key={f.id}
            className="flex items-center gap-2 text-sm bg-background rounded-lg px-3 py-2 border"
          >
            <span className="text-xs text-muted-foreground w-5 shrink-0">#{idx + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 font-medium">
                {f.airline && <span className="text-muted-foreground text-xs">{f.airline}</span>}
                {f.flight_number && (
                  <span className="font-mono text-xs font-bold">{f.flight_number}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <span>{f.departure_city}{f.origin_iata ? ` (${f.origin_iata})` : ''}</span>
                <Plane className="w-3 h-3 shrink-0" />
                <span>{f.arrival_city}{f.destination_iata ? ` (${f.destination_iata})` : ''}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {f.departure_date}{f.departure_time ? ` · ${f.departure_time}` : ''}
                {' → '}
                {f.arrival_date}{f.arrival_time ? ` · ${f.arrival_time}` : ''}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive shrink-0"
              onClick={() => handleRemove(f.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}

        {/* Add form */}
        {isAdding ? (
          <div className="space-y-3 border rounded-lg bg-background p-3">
            {/* Flight number + date */}
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-xs font-semibold">Flight Number</Label>
                <Input
                  placeholder="BA123"
                  value={form.flight_number}
                  onChange={e => handleField('flight_number', e.target.value.toUpperCase())}
                  className="font-mono font-bold uppercase"
                />
              </div>
              <div className="w-36 space-y-1">
                <Label className="text-xs">Departure Date *</Label>
                <Input
                  type="date"
                  value={form.departure_date}
                  onChange={e => handleField('departure_date', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Airline */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Airline</Label>
              <Input
                placeholder="e.g. British Airways"
                value={form.airline}
                onChange={e => handleField('airline', e.target.value)}
              />
            </div>

            {/* Cities: From ✈ To */}
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-xs font-medium">From *</Label>
                <Input
                  placeholder="Departure city"
                  value={form.departure_city}
                  onChange={e => handleField('departure_city', e.target.value)}
                  required
                />
                <Input
                  placeholder="IATA (LHR)"
                  value={form.origin_iata}
                  onChange={e => handleField('origin_iata', e.target.value.toUpperCase())}
                  className="h-7 text-xs font-mono"
                  maxLength={3}
                />
              </div>
              <div className="flex items-center justify-center pt-5 px-1">
                <Plane className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs font-medium">To *</Label>
                <Input
                  placeholder="Arrival city"
                  value={form.arrival_city}
                  onChange={e => handleField('arrival_city', e.target.value)}
                  required
                />
                <Input
                  placeholder="IATA (CDG)"
                  value={form.destination_iata}
                  onChange={e => handleField('destination_iata', e.target.value.toUpperCase())}
                  className="h-7 text-xs font-mono"
                  maxLength={3}
                />
              </div>
            </div>

            {/* Times */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Dep. Time</Label>
                <Input
                  type="time"
                  value={form.departure_time}
                  onChange={e => handleField('departure_time', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Arrival Date *</Label>
                <Input
                  type="date"
                  value={form.arrival_date}
                  onChange={e => handleField('arrival_date', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Arr. Time</Label>
                <Input
                  type="time"
                  value={form.arrival_time}
                  onChange={e => handleField('arrival_time', e.target.value)}
                />
              </div>
            </div>

            {/* International toggle */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-muted-foreground h-7 px-0">
                  More options
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <label className="flex items-center gap-2 text-sm cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={form.is_international}
                    onChange={e => handleField('is_international', e.target.checked)}
                    className="rounded"
                  />
                  International flight (longer airport buffer)
                </label>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="w-3.5 h-3.5 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleAdd}>
                Add & Re-generate
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 border-dashed"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Add a flight
          </Button>
        )}

        {flights.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            ✈ Arrival times automatically adjust your day's start time (+2 hr buffer)
          </p>
        )}
      </CardContent>
    </Card>
  );
};
