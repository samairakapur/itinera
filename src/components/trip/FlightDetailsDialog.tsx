import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plane, Plus, Trash2, Edit2, Upload, Loader2, Camera, Search } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  useFlightDetails,
  useCreateFlightDetail,
  useUpdateFlightDetail,
  useDeleteFlightDetail,
  FlightDetail,
} from '@/hooks/useFlightDetails';

interface FlightDetailsDialogProps {
  itineraryId: string;
  tripName?: string;
  tripDestinationCity?: string;
  tripStartDate?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Called after any flight is successfully created or updated */
  onFlightSaved?: () => void;
}

interface FlightFormData {
  airline: string;
  flight_number: string;
  departure_city: string;
  arrival_city: string;
  departure_date: string;
  departure_time: string;
  arrival_date: string;
  arrival_time: string;
  notes: string;
  // Auto-populated by flight search, not shown as editable fields
  departure_airport_iata: string;
  arrival_airport_iata: string;
  departure_terminal: string;
  arrival_terminal: string;
}

const emptyForm: FlightFormData = {
  airline: '',
  flight_number: '',
  departure_city: '',
  arrival_city: '',
  departure_date: '',
  departure_time: '',
  arrival_date: '',
  arrival_time: '',
  notes: '',
  departure_airport_iata: '',
  arrival_airport_iata: '',
  departure_terminal: '',
  arrival_terminal: '',
};

export const FlightDetailsDialog = ({
  itineraryId,
  tripName,
  tripDestinationCity: _tripDestinationCity,
  tripStartDate: _tripStartDate,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onFlightSaved,
}: FlightDetailsDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange || (() => {})) : setInternalOpen;
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FlightFormData>(emptyForm);
  const [isParsing, setIsParsing] = useState(false);
  const [parseWarning, setParseWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Flight search state
  const [searchFlightNumber, setSearchFlightNumber] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const { data: flights = [], isLoading } = useFlightDetails(itineraryId);
  const createFlight = useCreateFlightDetail();
  const updateFlight = useUpdateFlightDetail();
  const deleteFlight = useDeleteFlightDetail();

  const handleInputChange = (field: keyof FlightFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Search flight by number + date via lookup-flight edge function
  const handleFlightSearch = async () => {
    if (!searchFlightNumber.trim() || !searchDate) {
      toast.error('Enter both flight number and date to search');
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('lookup-flight', {
        body: { flight_number: searchFlightNumber.trim(), date: searchDate },
      });

      if (error) throw error;

      if (data?.error === 'FLIGHT_LOOKUP_UNAVAILABLE') {
        // API key not configured — silently fall through to manual entry
        toast.info('Flight search not configured. Enter details manually.');
        setIsAdding(true);
        return;
      }

      if (data?.error === 'FLIGHT_NOT_FOUND') {
        toast.error('Flight not found. Please enter details manually.');
        setIsAdding(true);
        return;
      }

      if (data?.flight) {
        const f = data.flight;
        setFormData({
          airline: f.airline || '',
          flight_number: f.flight_number || '',
          departure_city: f.departure_city || '',
          arrival_city: f.arrival_city || '',
          departure_date: f.departure_date || searchDate,
          departure_time: f.departure_time || '',
          arrival_date: f.arrival_date || searchDate,
          arrival_time: f.arrival_time || '',
          notes: [
            f.departure_terminal ? `Dep. Terminal: ${f.departure_terminal}` : '',
            f.arrival_terminal ? `Arr. Terminal: ${f.arrival_terminal}` : '',
          ].filter(Boolean).join(' | '),
          departure_airport_iata: f.departure_airport_iata || '',
          arrival_airport_iata: f.arrival_airport_iata || '',
          departure_terminal: f.departure_terminal || '',
          arrival_terminal: f.arrival_terminal || '',
        });
        setIsAdding(true);
        toast.success('Flight details found — review and confirm below');
      }
    } catch (err) {
      console.error('Flight search error:', err);
      toast.error('Search failed. Enter details manually.');
      setIsAdding(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async () => {
    if (!formData.departure_city || !formData.arrival_city || !formData.departure_date || !formData.arrival_date) {
      return;
    }

    try {
      if (editingId) {
        await updateFlight.mutateAsync({
          id: editingId,
          itinerary_id: itineraryId,
          airline: formData.airline || null,
          flight_number: formData.flight_number || null,
          departure_city: formData.departure_city,
          arrival_city: formData.arrival_city,
          departure_date: formData.departure_date,
          departure_time: formData.departure_time || null,
          arrival_date: formData.arrival_date,
          arrival_time: formData.arrival_time || null,
          notes: formData.notes || null,
          departure_airport_iata: formData.departure_airport_iata || null,
          arrival_airport_iata: formData.arrival_airport_iata || null,
          departure_terminal: formData.departure_terminal || null,
          arrival_terminal: formData.arrival_terminal || null,
        });
      } else {
        await createFlight.mutateAsync({
          itinerary_id: itineraryId,
          leg_number: flights.length + 1,
          airline: formData.airline || undefined,
          flight_number: formData.flight_number || undefined,
          departure_city: formData.departure_city,
          arrival_city: formData.arrival_city,
          departure_date: formData.departure_date,
          departure_time: formData.departure_time || undefined,
          arrival_date: formData.arrival_date,
          arrival_time: formData.arrival_time || undefined,
          notes: formData.notes || undefined,
          departure_airport_iata: formData.departure_airport_iata || undefined,
          arrival_airport_iata: formData.arrival_airport_iata || undefined,
          departure_terminal: formData.departure_terminal || undefined,
          arrival_terminal: formData.arrival_terminal || undefined,
        });
      }

      setFormData(emptyForm);
      setIsAdding(false);
      setEditingId(null);
      setSearchFlightNumber('');
      setSearchDate('');
      onFlightSaved?.();
    } catch (err) {
      // Error toast is handled by mutation onError callback; just log here
      console.error('[FlightDetailsDialog] save error:', err);
    }
  };

  const handleEdit = (flight: FlightDetail) => {
    setFormData({
      airline: flight.airline || '',
      flight_number: flight.flight_number || '',
      departure_city: flight.departure_city,
      arrival_city: flight.arrival_city,
      departure_date: flight.departure_date,
      departure_time: flight.departure_time || '',
      arrival_date: flight.arrival_date,
      arrival_time: flight.arrival_time || '',
      notes: flight.notes || '',
      departure_airport_iata: flight.departure_airport_iata || '',
      arrival_airport_iata: flight.arrival_airport_iata || '',
      departure_terminal: flight.departure_terminal || '',
      arrival_terminal: flight.arrival_terminal || '',
    });
    setEditingId(flight.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    await deleteFlight.mutateAsync({ id, itineraryId });
  };

  const handleCancel = () => {
    setFormData(emptyForm);
    setIsAdding(false);
    setEditingId(null);
    setSearchFlightNumber('');
    setSearchDate('');
    setParseWarning(null);
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

      // Edge function errors are surfaced through data.success === false now,
      // but handle hard invoke errors gracefully too
      if (error) {
        console.warn('parse-flight invoke error (falling back to manual):', error);
        setParseWarning("We couldn't read all details from your boarding pass — please check and complete the fields below.");
        setIsAdding(true);
        return;
      }

      // Full success path — all required fields extracted
      if (data?.success === true && data.flights?.length > 0) {
        const completeFlights = data.flights.filter(
          (f: any) => f.departure_city && f.arrival_city && f.departure_date && f.arrival_date
        );
        if (completeFlights.length > 0) {
          let addedCount = 0;
          for (const flight of completeFlights) {
            await createFlight.mutateAsync({
              itinerary_id: itineraryId,
              leg_number: flights.length + addedCount + 1,
              airline: flight.airline || undefined,
              flight_number: flight.flight_number || undefined,
              departure_city: flight.departure_city,
              arrival_city: flight.arrival_city,
              departure_date: flight.departure_date,
              departure_time: flight.departure_time || undefined,
              arrival_date: flight.arrival_date,
              arrival_time: flight.arrival_time || undefined,
              notes: flight.notes || undefined,
            });
            addedCount++;
          }
          toast.success(`${addedCount} flight${addedCount > 1 ? 's' : ''} parsed and added! Your itinerary will adjust automatically.`);
          return;
        }
      }

      // Partial or failed parse — open manual entry with pre-filled fields
      const partial = data?.partial ?? {};
      setFormData({
        airline: partial.airline || '',
        flight_number: partial.flightNumber || partial.flight_number || '',
        departure_city: partial.departure_city || '',
        arrival_city: partial.arrival_city || '',
        departure_date: partial.departureDate || partial.departure_date || '',
        departure_time: partial.departureTime || partial.departure_time || '',
        arrival_date: partial.arrival_date || '',
        arrival_time: partial.arrivalTime || partial.arrival_time || '',
        notes: partial.notes || '',
        departure_airport_iata: partial.departureAirport || '',
        arrival_airport_iata: partial.arrivalAirport || '',
        departure_terminal: '',
        arrival_terminal: '',
      });
      setParseWarning(
        data?.message || "We couldn't read all details from your boarding pass — please check and complete the fields below."
      );
      setIsAdding(true);
    } catch (err) {
      console.error('Error parsing flight:', err);
      setParseWarning("We couldn't read all details from your boarding pass — please check and complete the fields below.");
      setIsAdding(true);
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const statusColor: Record<string, string> = {
    delayed: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-red-100 text-red-700',
    landed: 'bg-green-100 text-green-700',
    scheduled: 'bg-blue-100 text-blue-700',
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
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto sm:w-full">
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
                    <span className="text-sm font-medium">Upload Flight Confirmation (optional)</span>
                    <span className="text-xs text-muted-foreground">Upload a screenshot — AI will try to extract details. Manual entry is more reliable.</span>
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
                    {flight.status && flight.status !== 'scheduled' && (
                      <Badge className={`text-xs ${statusColor[flight.status] ?? ''}`}>
                        {flight.status}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(flight)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(flight.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{flight.departure_city}</p>
                    {flight.departure_airport_iata && (
                      <p className="text-xs font-mono text-muted-foreground">{flight.departure_airport_iata}</p>
                    )}
                    <p className="text-muted-foreground text-xs">
                      {format(new Date(flight.departure_date), 'MMM d, yyyy')}
                      {flight.departure_time && ` at ${flight.departure_time.slice(0, 5)}`}
                    </p>
                    {flight.departure_terminal && (
                      <p className="text-xs text-muted-foreground">Terminal {flight.departure_terminal}</p>
                    )}
                  </div>
                  <Plane className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 text-right">
                    <p className="font-medium">{flight.arrival_city}</p>
                    {flight.arrival_airport_iata && (
                      <p className="text-xs font-mono text-muted-foreground">{flight.arrival_airport_iata}</p>
                    )}
                    <p className="text-muted-foreground text-xs">
                      {format(new Date(flight.arrival_date), 'MMM d, yyyy')}
                      {flight.arrival_time && ` at ${flight.arrival_time.slice(0, 5)}`}
                    </p>
                    {flight.arrival_terminal && (
                      <p className="text-xs text-muted-foreground">Terminal {flight.arrival_terminal}</p>
                    )}
                  </div>
                </div>

                {flight.notes && (
                  <p className="text-xs text-muted-foreground mt-2 border-t pt-2">{flight.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Add/Edit form */}
          {isAdding ? (
            <Card>
              <CardContent className="p-4 space-y-4">
                <p className="text-sm font-medium">
                  {editingId ? 'Edit Flight' : 'Add New Flight'}
                </p>

                {/* Inline warning from image parsing failure */}
                {parseWarning && (
                  <div className="text-sm text-muted-foreground bg-muted/60 rounded-lg px-3 py-2.5 border border-border">
                    {parseWarning}
                  </div>
                )}

                {/* Flight number search — only visible when adding a new flight */}
                {!editingId && (
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Search by flight number (optional)</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. BA123"
                        value={searchFlightNumber}
                        onChange={(e) => setSearchFlightNumber(e.target.value.toUpperCase())}
                        className="flex-1"
                        onKeyDown={(e) => e.key === 'Enter' && handleFlightSearch()}
                      />
                      <Input
                        type="date"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        className="w-36"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleFlightSearch}
                        disabled={isSearching || !searchFlightNumber.trim() || !searchDate}
                      >
                        {isSearching ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Auto-fills the form below if found</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Airline</Label>
                    <Input placeholder="e.g., British Airways" value={formData.airline} onChange={(e) => handleInputChange('airline', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Flight Number</Label>
                    <Input placeholder="e.g., BA123" value={formData.flight_number} onChange={(e) => handleInputChange('flight_number', e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">From City *</Label>
                    <Input placeholder="Departure city" value={formData.departure_city} onChange={(e) => handleInputChange('departure_city', e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">To City *</Label>
                    <Input placeholder="Arrival city" value={formData.arrival_city} onChange={(e) => handleInputChange('arrival_city', e.target.value)} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Departure Date *</Label>
                    <Input type="date" value={formData.departure_date} onChange={(e) => handleInputChange('departure_date', e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Departure Time</Label>
                    <Input type="time" value={formData.departure_time} onChange={(e) => handleInputChange('departure_time', e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Arrival Date *</Label>
                    <Input type="date" value={formData.arrival_date} onChange={(e) => handleInputChange('arrival_date', e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Arrival Time</Label>
                    <Input type="time" value={formData.arrival_time} onChange={(e) => handleInputChange('arrival_time', e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Notes</Label>
                  <Textarea placeholder="Terminal, gate, confirmation number..." value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} rows={2} />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
                  <Button size="sm" onClick={handleSave} disabled={!formData.departure_city || !formData.arrival_city || !formData.departure_date || !formData.arrival_date}>
                    {editingId ? 'Update' : 'Add Flight'}
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
              ✈️ Flight times automatically adjust your itinerary — arrival/departure days show available time and constraints.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
