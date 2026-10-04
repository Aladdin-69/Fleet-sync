import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Shield, Loader2 } from 'lucide-react';
import { getPermissionLabel } from '@/components/permissions';

const availablePermissions = [
  'manage_vehicles',
  'manage_bookings',
  'view_alerts',
  'manage_alerts',
  'view_emails',
  'view_calendar',
  'manage_settings',
  'invite_users'
];

export default function EditUserPermissionsModal({ open, onClose, user, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    full_name: '',
    extended_role: '',
    permissions: [],
    department: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        extended_role: user.extended_role || '',
        permissions: user.permissions || [],
        department: user.department || ''
      });
    }
  }, [user]);

  const handlePermissionChange = (permission, checked) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Modifier les permissions - {user.full_name || user.email}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div>
            <Label htmlFor="full-name">Nom complet</Label>
            <Input
              id="full-name"
              placeholder="Nom complet"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="extended-role">Rôle étendu</Label>
            <Select 
              value={formData.extended_role} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, extended_role: value }))}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Aucun (rôle par défaut)</SelectItem>
                <SelectItem value="manager">Gestionnaire</SelectItem>
                <SelectItem value="viewer">Observateur</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 mt-2">
              Le rôle de base ({user.role}) ne peut pas être modifié ici
            </p>
          </div>

          <div>
            <Label htmlFor="department">Département</Label>
            <Input
              id="department"
              placeholder="Ex: Location, Support, Admin"
              value={formData.department}
              onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="mb-3 block">Permissions personnalisées</Label>
            <div className="space-y-3 border border-slate-200 rounded-lg p-4">
              {availablePermissions.map((permission) => (
                <div key={permission} className="flex items-center gap-2">
                  <Checkbox
                    id={permission}
                    checked={formData.permissions.includes(permission)}
                    onCheckedChange={(checked) => handlePermissionChange(permission, checked)}
                  />
                  <Label htmlFor={permission} className="font-normal cursor-pointer text-sm">
                    {getPermissionLabel(permission)}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Les permissions personnalisées s'ajoutent aux permissions du rôle
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}