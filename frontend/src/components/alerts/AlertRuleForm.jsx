import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, X } from 'lucide-react';

export default function AlertRuleForm({ rule, vehicles, onSave, onCancel, isSuggestion }) {
  const [formData, setFormData] = useState(rule || {
    name: '',
    condition_type: 'duplicate_bookings',
    condition_params: {},
    notification_channels: ['email', 'in_app'],
    severity: 'warning',
    enabled: true
  });

  const conditionTypes = [
    { id: 'duplicate_bookings', label: 'Réservations dupliquées', icon: AlertTriangle },
    { id: 'late_cancellation', label: 'Annulation tardive', icon: AlertTriangle },
    { id: 'platform_mismatch', label: 'Erreur plateforme', icon: AlertTriangle },
    { id: 'high_value_booking', label: 'Haute valeur', icon: AlertTriangle },
    { id: 'multiple_platforms', label: 'Multi-plateforme', icon: AlertTriangle },
  ];

  const selectedType = conditionTypes.find(t => t.id === formData.condition_type);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {rule ? 'Modifier la règle' : 'Nouvelle règle d\'alerte'}
          </CardTitle>
          {isSuggestion && (
            <Badge className="bg-blue-100 text-blue-700">Suggestion IA</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Name */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">
            Nom de la règle
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Ex: Alerte doublons Turo"
          />
        </div>

        {/* Condition Type */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">
            Type de condition
          </label>
          <Select value={formData.condition_type} onValueChange={(value) => 
            setFormData({...formData, condition_type: value, condition_params: {}})
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {conditionTypes.map(type => (
                <SelectItem key={type.id} value={type.id}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Condition Parameters */}
        {formData.condition_type === 'duplicate_bookings' && (
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">
              Fenêtre de temps (heures)
            </label>
            <Input
              type="number"
              min="1"
              value={formData.condition_params.time_window_hours || 24}
              onChange={(e) => setFormData({
                ...formData,
                condition_params: {...formData.condition_params, time_window_hours: parseInt(e.target.value)}
              })}
            />
            <p className="text-xs text-slate-500 mt-1">Alerte si plusieurs réservations le même jour pour le même véhicule</p>
          </div>
        )}

        {formData.condition_type === 'late_cancellation' && (
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">
              Délai minimum (jours avant réservation)
            </label>
            <Input
              type="number"
              min="0"
              value={formData.condition_params.min_days_before_booking || 2}
              onChange={(e) => setFormData({
                ...formData,
                condition_params: {...formData.condition_params, min_days_before_booking: parseInt(e.target.value)}
              })}
            />
            <p className="text-xs text-slate-500 mt-1">Alerte si annulation reçue moins de X jours avant la réservation</p>
          </div>
        )}

        {formData.condition_type === 'high_value_booking' && (
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">
              Montant minimum (€)
            </label>
            <Input
              type="number"
              min="0"
              value={formData.condition_params.min_amount || 500}
              onChange={(e) => setFormData({
                ...formData,
                condition_params: {...formData.condition_params, min_amount: parseInt(e.target.value)}
              })}
            />
          </div>
        )}

        {formData.condition_type === 'platform_mismatch' && (
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">
              Plateforme(s)
            </label>
            <div className="space-y-2">
              {['turo', 'getaround', 'hunos_rent'].map(platform => (
                <label key={platform} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={formData.condition_params.platforms?.includes(platform) || false}
                    onCheckedChange={(checked) => {
                      const platforms = formData.condition_params.platforms || [];
                      setFormData({
                        ...formData,
                        condition_params: {
                          ...formData.condition_params,
                          platforms: checked 
                            ? [...platforms, platform]
                            : platforms.filter(p => p !== platform)
                        }
                      });
                    }}
                  />
                  <span className="text-sm text-slate-700 capitalize">{platform}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Notification Channels */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">
            Canaux de notification
          </label>
          <div className="space-y-2">
            {['email', 'in_app', 'sms'].map(channel => (
              <label key={channel} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.notification_channels?.includes(channel) || false}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      notification_channels: checked
                        ? [...(formData.notification_channels || []), channel]
                        : (formData.notification_channels || []).filter(c => c !== channel)
                    });
                  }}
                />
                <span className="text-sm text-slate-700 capitalize">{channel}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Severity */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">
            Niveau de sévérité
          </label>
          <Select value={formData.severity} onValueChange={(value) => 
            setFormData({...formData, severity: value})
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Avertissement</SelectItem>
              <SelectItem value="critical">Critique</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active */}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={formData.enabled}
            onCheckedChange={(checked) => setFormData({...formData, enabled: checked})}
          />
          <label className="text-sm font-medium text-slate-700 cursor-pointer">
            Activer cette règle
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={() => onSave(formData)} className="bg-blue-600 hover:bg-blue-700">
            {rule ? 'Mettre à jour' : 'Créer la règle'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}