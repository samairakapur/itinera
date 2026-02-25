import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plane, Plus, Trash2, Edit2, Upload, Loader2, Camera, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  useFlightDetails,
  useCreateFlightDetail,
  useUpdateFlightDetail,
  useDeleteFlightDetail,
  FlightDetail
} from '@/hooks/useFlightDetails';

interface FlightDetailsDialogProps {
  itineraryId: string;
  tripName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface FlightFormData {
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
  booking_reference: string;
  notes: string;
}

interface EnrichedData {
  is_international: boolean;
  delay_minutes: number;
}

type LookupStatus = 'idle' | 'found' | 'not-found';

const emptyForm: FlightFormData = {
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
  booking_reference: '',
  notes: '',
};

const emptyEnriched: EnrichedData = {
  is_international: false,
  delay_minutes: 0,
};

export const FlightDetailsDialog = ({
  itineraryId,
  tripName,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: FlightDetailsDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange || (() => {})) : setInternalOpen;
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FlightFormData>(emptyForm);
  const [enriched, setEnriched] = useState<EnrichedData>(emptyEnriched);
  const [isParsing, setIsParsing] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle');
  const [lookupSource, setLookupSource] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: flights = [] } = useFlightDetails(itineraryId);
  const createFlight = useCreateFlightDetail();
  const updateFlight = useUpdateFlightDetail();
  const deleteFlight = useDeleteFlightDetail();

  const handleInputChange = (field: keyof FlightFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Reset lookup status when key fields change
    if (field === 'flight_number' || field === 'departure_date') {
      setLookupStatus('idle');
    }
  };

  // Require at least "XX123" (4 chars) + a departure date before enabling lookup
  const canLookup = formData.flight_number.trim().length >= 4 && !!formData.departure_date;

  const handleLookup = async () => {
    if (!canLookup) return;
    setIsLookingUp(true);
    setLookupStatus('idle');

    try {
      const { data, error } = await supabase.functions.invoke('flight-lookup', {
        body: {
          flight_number: formData.flight_number.trim().toUpperCase(),
          departure_date: formData.departure_date,
          origin_iata: formData.origin_iata.trim().toUpperCase() || undefined,
        },
      });

      if (error) throw error;

      if (data?.found) {
        setFormData(prev => ({
          ...prev,
          departure_time:   data.departure_time    || prev.departure_time,
          arrival_time:     data.arrival_time      || prev.arrival_time,
          arrival_date:     data.arrival_date      || prev.arrival_date,
          airline:          data.airline           || prev.airline,
          origin_iata:      data.origin_iata       || prev.origin_iata,
          destination_iata: data.destination_iata  || prev.destination_iata,
        }));
        setEnriched({
          is_international: data.is_international ?? false,
          delay_minutes:    data.delay_minutes     ?? 0,
        });
        setLookupStatus('found');
        setLookupSource(data.source || 'live data');
        toast.success(`Flight times found via ${data.source || 'live data'}`);
      } else {
        setLookupStatus('not-found');
        toast.info(data?.note || 'Flight not found in live sources. Enter times manually.');
      }
    } catch (err) {
      console.error('Flight lookup error:', err);
      setLookupStatus('not-found');
      toast.error('Could not reach flight data. Enter times manually.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSave = async () => {
    if (!formData.departure_city || !formData.arrival_city || !formData.departure_date || !formData.arrival_date) {
      return;
    }

    const payload = {
      airline:           formData.airline           || null,
      flight_number:     formData.flight_number     || null,
      departure_city:    formData.departure_city,
      arrival_city:      formData.arrival_city,
      origin_iata:       formData.origin_iata       || null,
      destination_iata:  formData.destination_iata  || null,
      departure_date:    formData.departure_date,
      departure_time:    formData.departure_time     || null,
      arrival_date:      formData.arrival_date,
      arrival_time:      formData.arrival_time      || null,
      booking_reference: formData.booking_reference || null,
      notes:             formData.notes             || null,
      is_international:  enriched.is_international,
      delay_minutes:     enriched.delay_minutes,
    };

    if (editingId) {
      await updateFlight.mutateAsync({ id: editingId, ...payload });
    } else {
      await createFlight.mutateAsync({
        itinerary_id: itineraryId,
        leg_number: flights.length + 1,
        ...payload,
      });
    }

    setFormData(emptyForm);
    setEnriched(emptyEnriched);
    setLookupStatus('idle');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (flight: FlightDetail) => {
    setFormData({
      airline:           flight.airline           || '',
      flight_number:     flight.flight_number     || '',
      departure_city:    flight.departure_city,
      arrival_city:      flight.arrival_city,
      origin_iata:       flight.origin_iata       || '',
      destination_iata:  flight.destination_iata  || '',
      departure_date:    flight.departure_date,
      departure_time:    flight.departure_time    || '',
      arrival_date:      flight.arrival_date,
      arrival_time:      flight.arrival_time      || '',
      booking_reference: flight.booking_reference || '',
      notes:             flight.notes             || '',
    });
    setEnriched({
      is_international: flight.is_international ?? false,
      delay_minutes:    flight.delay_minutes     ?? 0,
    });
    setLookupStatus('idle');
    setEditingId(flight.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    await deleteFlight.mutateAsync({ id, itineraryId });
  };

  const handleCancel = () => {
    setFormData(emptyForm);
    setEnriched(emptyEnriched);
    setLookupStatus('idle');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleUploadScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }

    setIsParsing(true);

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('parse-flight', {
        body: { imageBase64: base64 },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (!data.flights || data.flights.length === 0) {
        toast.error('No flight details found in the image. Try a clearer screenshot.');
        return;
      }

      let addedCount = 0;
      for (const flight of data.flights) {
        if (!flight.departure_city || !flight.arrival_city || !flight.departure_date || !flight.arrival_date) {
          continue;
        }

        await createFlight.mutateAsync({
          itinerary_id: itineraryId,
          leg_number: flights.length + addedCount + 1,
          airline:        flight.airline        || undefined,
          flight_number:  flight.flight_number  || undefined,
          departure_city: flight.departure_city,
          arrival_city:   flight.arrival_city,
          departure_date: flight.departure_date,
          departure_time: flight.departure_time || undefined,
          arrival_date:   flight.arrival_date,
          arrival_time:   flight.arrival_time   || undefined,
          notes:          flight.notes          || undefined,
        });
        addedCount++;
      }

      toast.success(`${addedCount} flight${addedCount > 1 ? 's' : ''} parsed and added! Your itinerary will adjust automatically.`);
    } catch (err) {
      console.error('Error parsing flight:', err);
      toast.error('Failed to parse flight details. Try entering manually.');
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plane className="w-4 h-4" />
          Flights
          {flights.length > 0 && (
            <span className="ml-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs">
              {flights.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5" />
            Flight Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Screenshot */}
          <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleUploadScreenshot}
                className="hidden"
              />
              <Button
                variant="ghost"
                className="w-full gap-3 h-auto py-4 flex-col"
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsing}
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-sm font-medium">Parsing flight details...</span>
                    <span className="text-xs text-muted-foreground">AI is reading your confirmation</span>
                  </>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Camera className="w-5 h-5 text-primary" />
                      <Upload className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Upload Flight Confirmation</span>
                    <span className="text-xs text-muted-foreground">Take a photo or upload a screenshot — AI will extract all details</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Existing flights */}
          {flights.map((flight, index) => (
            <Card key={flight.id} className="relative">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded">
                      Leg {index + 1}
                    </span>
                    {flight.airline && flight.flight_number && (
                      <span className="text-sm text-muted-foreground">
                        {flight.airline} {flight.flight_number}
                      </span>
                    )}
                    {flight.is_international && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">Intl</Badge>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(flight)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(flight.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{flight.departure_city}</p>
                    <p className="text-muted-foreground text-xs">
                      {format(new Date(flight.departure_date), 'MMM d, yyyy')}
                      {flight.departure_time && ` · ${flight.departure_time.slice(0, 5)}`}
                    </p>
                    {flight.origin_iata && (
                      <p className="text-muted-foreground text-xs font-mono uppercase">{flight.origin_iata}</p>
                    )}
                  </div>
                  <Plane className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0 text-right">
                    <p className="font-medium truncate">{flight.arrival_city}</p>
                    <p className="text-muted-foreground text-xs">
                      {format(new Date(flight.arrival_date), 'MMM d, yyyy')}
                      {flight.arrival_time && ` · ${flight.arrival_time.slice(0, 5)}`}
                    </p>
                    {flight.destination_iata && (
                      <p className="text-muted-foreground text-xs font-mono uppercase">{flight.destination_iata}</p>
                    )}
                  </div>
                </div>

                {flight.delay_minutes > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                    ⚠ Delay: +{flight.delay_minutes} min — itinerary adjusted automatically
                  </p>
                )}

                {flight.booking_reference && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Ref: <span className="font-mono">{flight.booking_reference}</span>
                  </p>
                )}

                {flight.notes && (
                  <p className="text-xs text-muted-foreground mt-2 border-t pt-2">{flight.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Add / Edit form */}
          {isAdding ? (
            <Card>
              <CardContent className="p-4 space-y-4">
                <p className="text-sm font-medium">
                  {editingId ? 'Edit Flight' : 'Add New Flight'}
                </p>

                {/* Airline + Flight number */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Airline</Label>
                    <Input
                      placeholder="e.g., British Airways"
                      value={formData.airline}
                      onChange={(e) => handleInputChange('airline', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Flight Number</Label>
                    <Input
                      placeholder="e.g., BA123"
                      value={formData.flight_number}
                      onChange={(e) => handleInputChange('flight_number', e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                {/* Cities with IATA codes */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">From City *</Label>
                    <Input
                      placeholder="Departure city"
                      value={formData.departure_city}
                      onChange={(e) => handleInputChange('departure_city', e.target.value)}
                      required
                    />
                    <Input
                      placeholder="Airport code (e.g., LHR)"
                      value={formData.origin_iata}
                      onChange={(e) => handleInputChange('origin_iata', e.target.value.toUpperCase())}
                      className="text-xs h-7 font-mono"
                      maxLength={3}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">To City *</Label>
                    <Input
                      placeholder="Arrival city"
                      value={formData.arrival_city}
                      onChange={(e) => handleInputChange('arrival_city', e.target.value)}
                      required
                    />
                    <Input
                      placeholder="Airport code (e.g., CDG)"
                      value={formData.destination_iata}
                      onChange={(e) => handleInputChange('destination_iata', e.target.value.toUpperCase())}
                      className="text-xs h-7 font-mono"
                      maxLength={3}
                    />
                  </div>
                </div>

                {/* Departure date + time */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Departure Date *</Label>
                    <Input
                      type="date"
                      value={formData.departure_date}
                      onChange={(e) => handleInputChange('departure_date', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Departure Time</Label>
                    <Input
                      type="time"
                      value={formData.departure_time}
                      onChange={(e) => handleInputChange('departure_time', e.target.value)}
                    />
                  </div>
                </div>

                {/* Look Up button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={handleLookup}
                  disabled={!canLookup || isLookingUp}
                  type="button"
                >
                  {isLookingUp ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Looking up live flight data…
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      Look Up Flight Times ✈
                    </>
                  )}
                </Button>

                {/* Lookup status feedback */}
                {lookupStatus === 'found' && (
                  <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400 px-3 py-2 rounded-md border border-green-200 dark:border-green-800">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Times auto-filled from <strong>{lookupSource}</strong>. Review and adjust if needed.</span>
                  </div>
                )}
                {lookupStatus === 'not-found' && (
                  <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 px-3 py-2 rounded-md border border-amber-200 dark:border-amber-800">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Flight not found in live data — enter times manually below.</span>
                  </div>
                )}

                {/* Arrival date + time */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Arrival Date *</Label>
                    <Input
                      type="date"
                      value={formData.arrival_date}
                      onChange={(e) => handleInputChange('arrival_date', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Arrival Time</Label>
                    <Input
                      type="time"
                      value={formData.arrival_time}
                      onChange={(e) => handleInputChange('arrival_time', e.target.value)}
                    />
                  </div>
                </div>

                {/* Booking reference */}
                <div className="space-y-1">
                  <Label className="text-xs">Booking Reference</Label>
                  <Input
                    placeholder="e.g., ABCDEF"
                    value={formData.booking_reference}
                    onChange={(e) => handleInputChange('booking_reference', e.target.value.toUpperCase())}
                    className="font-mono uppercase"
                    maxLength={10}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <Label className="text-xs">Notes</Label>
                  <Textarea
                    placeholder="Terminal, gate, baggage info…"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={
                      !formData.departure_city ||
                      !formData.arrival_city ||
                      !formData.departure_date ||
                      !formData.arrival_date
                    }
                  >
                    {editingId ? 'Update Flight' : 'Add Flight'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button variant="outline" className="w-full gap-2" onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4" />
              Add Flight Manually
            </Button>
          )}

          {flights.length > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              ✈️ Flight times automatically adjust your itinerary — arrival/departure days show available hours and buffer constraints.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
