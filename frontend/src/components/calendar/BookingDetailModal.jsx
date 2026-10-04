import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Hash, FileText, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

const platformColors = {
  turo: 'bg-purple-100 text-purple-700 border-purple-200',
  getaround: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  hunos_rent: 'bg-orange-100 text-orange-700 border-orange-200',
  manual: 'bg-slate-100 text-slate-700 border-slate-200'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-red-100 text-red-700'
};

export default function BookingDetailModal({ booking, vehicle, open, onOpenChange, onUpdate }) {
  const [notes, setNotes] = useState(booking?.notes || '');
  const [instructions, setInstructions] = useState(booking?.instructions || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!booking || !vehicle) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(booking.id, { notes, instructions });
      toast.success('Réservation mise à jour');
      onOpenChange(false);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Détails de la réservation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vehicle & Status */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">{vehicle.name}</h3>
              <p className="text-sm text-slate-500">{vehicle.license_plate}</p>
            </div>
            <div className="flex gap-2">
              <Badge className={platformColors[booking.platform]}>
                {booking.platform?.replace('_', ' ')}
              </Badge>
              <Badge className={statusColors[booking.status]}>
                {booking.status}
              </Badge>
            </div>
          </div>

          {/* Booking Details */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <Calendar className="w-4 h-4" />
                Début
              </div>
              <p className="font-medium text-slate-900">
                {format(parseISO(booking.start_date), 'dd/MM/yyyy HH:mm')}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <Calendar className="w-4 h-4" />
                Fin
              </div>
              <p className="font-medium text-slate-900">
                {format(parseISO(booking.end_date), 'dd/MM/yyyy HH:mm')}
              </p>
            </div>
            {booking.guest_name && (
              <div>
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <User className="w-4 h-4" />
                  Client
                </div>
                <p className="font-medium text-slate-900">{booking.guest_name}</p>
              </div>
            )}
            {booking.booking_reference && (
              <div>
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <Hash className="w-4 h-4" />
                  Référence
                </div>
                <p className="font-medium text-slate-900">{booking.booking_reference}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4" />
              Notes internes
            </Label>
            <Textarea
              id="notes"
              placeholder="Ajoutez des notes sur cette réservation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Instructions */}
          <div>
            <Label htmlFor="instructions" className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4" />
              Instructions spéciales
            </Label>
            <Textarea
              id="instructions"
              placeholder="Instructions pour le client ou la préparation du véhicule..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}