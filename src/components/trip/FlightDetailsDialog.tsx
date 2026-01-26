import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Plane, Plus, Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
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
};

export const FlightDetailsDialog = ({ itineraryId, tripName }: FlightDetailsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FlightFormData>(emptyForm);

  const { data: flights = [], isLoading } = useFlightDetails(itineraryId);
  const createFlight = useCreateFlightDetail();
  const updateFlight = useUpdateFlightDetail();
  const deleteFlight = useDeleteFlightDetail();

  const handleInputChange = (field: keyof FlightFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.departure_city || !formData.arrival_city || !formData.departure_date || !formData.arrival_date) {
      return;
    }

    if (editingId) {
      await updateFlight.mutateAsync({
        id: editingId,
        ...formData,
        departure_time: formData.departure_time || null,
        arrival_time: formData.arrival_time || null,
      });
    } else {
      await createFlight.mutateAsync({
        itinerary_id: itineraryId,
        leg_number: flights.length + 1,
        ...formData,
        departure_time: formData.departure_time || undefined,
        arrival_time: formData.arrival_time || undefined,
      });
    }

    setFormData(emptyForm);
    setIsAdding(false);
    setEditingId(null);
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
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plane className="w-4 h-4" />
          Flight Details
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
          {/* Existing flights */}
          {flights.map((flight, index) => (
            <Card key={flight.id} className="relative">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded">
                      Leg {index + 1}
                    </span>
                    {flight.airline && flight.flight_number && (
                      <span className="text-sm text-muted-foreground">
                        {flight.airline} {flight.flight_number}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleEdit(flight)}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDelete(flight.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{flight.departure_city}</p>
                    <p className="text-muted-foreground text-xs">
                      {format(new Date(flight.departure_date), 'MMM d, yyyy')}
                      {flight.departure_time && ` at ${flight.departure_time.slice(0, 5)}`}
                    </p>
                  </div>
                  <Plane className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 text-right">
                    <p className="font-medium">{flight.arrival_city}</p>
                    <p className="text-muted-foreground text-xs">
                      {format(new Date(flight.arrival_date), 'MMM d, yyyy')}
                      {flight.arrival_time && ` at ${flight.arrival_time.slice(0, 5)}`}
                    </p>
                  </div>
                </div>

                {flight.notes && (
                  <p className="text-xs text-muted-foreground mt-2 border-t pt-2">
                    {flight.notes}
                  </p>
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Airline</Label>
                    <Input
                      placeholder="e.g., Delta"
                      value={formData.airline}
                      onChange={(e) => handleInputChange('airline', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Flight Number</Label>
                    <Input
                      placeholder="e.g., DL123"
                      value={formData.flight_number}
                      onChange={(e) => handleInputChange('flight_number', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">From City *</Label>
                    <Input
                      placeholder="Departure city"
                      value={formData.departure_city}
                      onChange={(e) => handleInputChange('departure_city', e.target.value)}
                      required
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
                  </div>
                </div>

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

                <div className="space-y-1">
                  <Label className="text-xs">Notes</Label>
                  <Textarea
                    placeholder="Terminal, gate, confirmation number..."
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
                    disabled={!formData.departure_city || !formData.arrival_city || !formData.departure_date || !formData.arrival_date}
                  >
                    {editingId ? 'Update' : 'Add Flight'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="w-4 h-4" />
              Add Flight
            </Button>
          )}

          {flights.length > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Flight times will be used to adjust your itinerary for arrival and departure days.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
