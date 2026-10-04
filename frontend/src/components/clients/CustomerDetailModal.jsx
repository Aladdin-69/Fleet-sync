import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Star, Calendar, Settings } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

const platformColors = {
  turo: 'bg-purple-100 text-purple-700',
  getaround: 'bg-cyan-100 text-cyan-700',
  hunos_rent: 'bg-orange-100 text-orange-700',
  manual: 'bg-slate-100 text-slate-700'
};

export default function CustomerDetailModal({ customer, bookings, open, onOpenChange, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  if (!customer) return null;

  const handleEdit = () => {
    setFormData({
      full_name: customer.full_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      driver_license: customer.driver_license || '',
      preferences: customer.preferences || '',
      rating: customer.rating || 0,
      vip_status: customer.vip_status || false,
      preferred_platforms: customer.preferred_platforms || []
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(customer.id, formData);
      toast.success('Client mis à jour');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  const togglePlatform = (platform) => {
    setFormData(prev => ({
      ...prev,
      preferred_platforms: prev.preferred_platforms?.includes(platform)
        ? prev.preferred_platforms.filter(p => p !== platform)
        : [...(prev.preferred_platforms || []), platform]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Profil client
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="preferences">Préférences</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4">
            {!isEditing ? (
              <>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                      <span className="text-white font-semibold text-2xl">
                        {customer.full_name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{customer.full_name}</h3>
                      <p className="text-slate-500">{customer.email}</p>
                    </div>
                  </div>
                  {customer.vip_status && (
                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                      <Star className="w-4 h-4 mr-1 fill-yellow-500" />
                      VIP
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                  {customer.phone && (
                    <div>
                      <p className="text-sm text-slate-500">Téléphone</p>
                      <p className="font-medium text-slate-900">{customer.phone}</p>
                    </div>
                  )}
                  {customer.driver_license && (
                    <div>
                      <p className="text-sm text-slate-500">Permis de conduire</p>
                      <p className="font-medium text-slate-900">{customer.driver_license}</p>
                    </div>
                  )}
                  {customer.address && (
                    <div className="col-span-2">
                      <p className="text-sm text-slate-500">Adresse</p>
                      <p className="font-medium text-slate-900">{customer.address}</p>
                    </div>
                  )}
                  {customer.rating && (
                    <div>
                      <p className="text-sm text-slate-500">Note moyenne</p>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium text-slate-900">{customer.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <Button onClick={handleEdit} className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Nom complet *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="driver_license">Permis de conduire</Label>
                      <Input
                        id="driver_license"
                        value={formData.driver_license}
                        onChange={(e) => setFormData({ ...formData, driver_license: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Adresse</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rating">Note (0-5)</Label>
                    <Input
                      id="rating"
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="vip"
                      checked={formData.vip_status}
                      onCheckedChange={(checked) => setFormData({ ...formData, vip_status: checked })}
                    />
                    <Label htmlFor="vip">Statut VIP</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">
                Historique des réservations ({bookings.length})
              </h3>
            </div>

            {bookings.length === 0 ? (
              <p className="text-center py-8 text-slate-500">Aucune réservation</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div key={booking.id} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-slate-900">
                          {format(parseISO(booking.start_date), 'dd/MM/yyyy')} - {format(parseISO(booking.end_date), 'dd/MM/yyyy')}
                        </p>
                        {booking.booking_reference && (
                          <p className="text-sm text-slate-500">Réf: {booking.booking_reference}</p>
                        )}
                      </div>
                      <Badge className={platformColors[booking.platform]}>
                        {booking.platform?.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4">
            {!isEditing ? (
              <>
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Plateformes préférées</h4>
                  <div className="flex flex-wrap gap-2">
                    {customer.preferred_platforms?.length > 0 ? (
                      customer.preferred_platforms.map(platform => (
                        <Badge key={platform} className={platformColors[platform]}>
                          {platform.replace('_', ' ')}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">Aucune plateforme préférée</p>
                    )}
                  </div>
                </div>

                {customer.preferences && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Notes et préférences</h4>
                    <p className="text-sm text-slate-600 p-4 bg-slate-50 rounded-lg">{customer.preferences}</p>
                  </div>
                )}

                <Button onClick={handleEdit} className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Modifier les préférences
                </Button>
              </>
            ) : (
              <>
                <div>
                  <Label>Plateformes préférées</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['turo', 'getaround', 'hunos_rent', 'manual'].map(platform => (
                      <button
                        key={platform}
                        onClick={() => togglePlatform(platform)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${formData.preferred_platforms?.includes(platform)
                            ? platformColors[platform]
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                      >
                        {platform.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="preferences">Notes et préférences</Label>
                  <Textarea
                    id="preferences"
                    rows={4}
                    value={formData.preferences}
                    onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                    placeholder="Préférences du client, instructions spéciales..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}