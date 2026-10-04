import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bell, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { toast } from 'sonner';

export default function NotificationPreferencesModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState({
    captcha_errors: true,
    login_failures: true,
    network_errors: true,
    repeated_failures: true,
    booking_confirmations: true,
    sync_errors: true,
    email_notifications: true,
    push_notifications: true
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => apiClient.auth.me()
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (prefs) => apiClient.auth.updateMe({ notification_preferences: prefs }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Préférences de notification mises à jour');
    }
  });

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    await updatePreferencesMutation.mutate(preferences);
    onClose();
  };

  const notificationTypes = [
    {
      id: 'captcha_errors',
      label: 'Erreurs CAPTCHA',
      description: 'Alertes quand un CAPTCHA est détecté et nécessite une intervention manuelle',
      severity: 'critical'
    },
    {
      id: 'login_failures',
      label: 'Échecs de connexion',
      description: 'Alertes quand les identifiants sont incorrects ou expirés',
      severity: 'critical'
    },
    {
      id: 'network_errors',
      label: 'Erreurs de réseau',
      description: 'Alertes quand la connexion à une plateforme échoue',
      severity: 'critical'
    },
    {
      id: 'repeated_failures',
      label: 'Échecs répétés',
      description: 'Alertes quand plusieurs tentatives échouent consécutivement',
      severity: 'critical'
    },
    {
      id: 'booking_confirmations',
      label: 'Confirmations de réservation',
      description: 'Notifications quand une nouvelle réservation est ajoutée manuellement',
      severity: 'info'
    },
    {
      id: 'sync_errors',
      label: 'Erreurs de synchronisation',
      description: 'Alertes quand la synchronisation entre plateformes échoue',
      severity: 'warning'
    }
  ];

  const channelOptions = [
    {
      id: 'email_notifications',
      label: 'Notifications par email',
      icon: Mail,
      description: 'Recevoir les alertes par email'
    },
    {
      id: 'push_notifications',
      label: 'Notifications push',
      icon: Bell,
      description: 'Recevoir les alertes en temps réel dans l\'app'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Préférences de Notifications</DialogTitle>
          <DialogDescription>
            Configurez les types d'événements pour lesquels vous souhaitez être alerté
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Types of Notifications */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Types d'événements
            </h3>
            <div className="space-y-3">
              {notificationTypes.map(type => (
                <Card key={type.id} className="cursor-pointer hover:bg-slate-50 transition">
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{type.label}</p>
                        <Badge variant={type.severity === 'critical' ? 'destructive' : type.severity === 'warning' ? 'default' : 'secondary'}>
                          {type.severity === 'critical' ? 'Critique' : type.severity === 'warning' ? 'Avertissement' : 'Info'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">{type.description}</p>
                    </div>
                    <Switch
                      checked={preferences[type.id]}
                      onCheckedChange={() => handleToggle(type.id)}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Notification Channels */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5" /> Canaux de notification
            </h3>
            <div className="space-y-3">
              {channelOptions.map(channel => {
                const Icon = channel.icon;
                return (
                  <Card key={channel.id} className="cursor-pointer hover:bg-slate-50 transition">
                    <CardContent className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Icon className="w-5 h-5 text-slate-500" />
                        <div>
                          <p className="font-medium">{channel.label}</p>
                          <p className="text-sm text-slate-600">{channel.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences[channel.id]}
                        onCheckedChange={() => handleToggle(channel.id)}
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Vous recevrez des alertes pour <strong>{Object.values(preferences).filter(Boolean).length}</strong> type(s) d'événement sur <strong>{preferences.email_notifications ? 'email' : ''}{preferences.email_notifications && preferences.push_notifications ? ' et ' : ''}{preferences.push_notifications ? 'push' : ''}</strong>
              </span>
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={updatePreferencesMutation.isPending}>
            {updatePreferencesMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder les préférences'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}