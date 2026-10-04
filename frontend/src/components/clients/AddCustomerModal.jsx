import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function AddCustomerModal({ open, onOpenChange, onAdd }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    driver_license: '',
    preferences: '',
    rating: 0,
    vip_status: false,
    preferred_platforms: []
  });
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email) {
      toast.error('Nom et email sont requis');
      return;
    }

    setIsAdding(true);
    try {
      await onAdd(formData);
      toast.success('Client ajouté avec succès');
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        address: '',
        driver_license: '',
        preferences: '',
        rating: 0,
        vip_status: false,
        preferred_platforms: []
      });
      onOpenChange(false);
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du client');
    } finally {
      setIsAdding(false);
    }
  };

  const togglePlatform = (platform) => {
    setFormData(prev => ({
      ...prev,
      preferred_platforms: prev.preferred_platforms.includes(platform)
        ? prev.preferred_platforms.filter(p => p !== platform)
        : [...prev.preferred_platforms, platform]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Ajouter un client
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Nom complet *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
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
            <Label>Plateformes préférées</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {['turo', 'getaround', 'hunos_rent', 'manual'].map(platform => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => togglePlatform(platform)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    formData.preferred_platforms.includes(platform)
                      ? 'bg-blue-500 text-white'
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
              rows={3}
              value={formData.preferences}
              onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
              placeholder="Préférences du client, instructions spéciales..."
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

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isAdding}>
              {isAdding ? 'Ajout...' : 'Ajouter le client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}