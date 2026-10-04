import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Edit2, AlertTriangle, Lightbulb } from 'lucide-react';
import AlertRuleForm from '@/components/alerts/AlertRuleForm';
import AIAlertSuggestions from '@/components/alerts/AIAlertSuggestions';
import { useLanguage } from '@/components/LanguageProvider';

export default function AlertRules() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const { data: alertRules = [] } = useQuery({
    queryKey: ['alertRules'],
    queryFn: () => apiClient.entities.AlertRule.list('-created_date')
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => apiClient.entities.Vehicle.list()
  });

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: (ruleData) => apiClient.entities.AlertRule.create(ruleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertRules'] });
      setShowForm(false);
    }
  });

  // Update rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.AlertRule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertRules'] });
      setEditingRule(null);
    }
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: (id) => apiClient.entities.AlertRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertRules'] });
    }
  });

  const handleSaveRule = (ruleData) => {
    if (editingRule) {
      updateRuleMutation.mutate({ id: editingRule.id, data: ruleData });
    } else {
      createRuleMutation.mutate(ruleData);
    }
  };

  const activeRules = alertRules.filter(r => r.enabled);
  const severityColors = {
    info: 'bg-blue-100 text-blue-700',
    warning: 'bg-yellow-100 text-yellow-700',
    critical: 'bg-red-100 text-red-700'
  };

  const conditionLabels = {
    duplicate_bookings: 'Réservations dupliquées',
    late_cancellation: 'Annulation tardive',
    platform_mismatch: 'Erreur plateforme',
    high_value_booking: 'Haute valeur',
    multiple_platforms: 'Multi-plateforme'
  };

  if (editingRule || showForm) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Règles d'alerte IA</h1>
            <p className="text-slate-500 mt-1">Configurez des alertes personnalisées basées sur l'IA</p>
          </div>

          <AlertRuleForm
            rule={editingRule}
            vehicles={vehicles}
            onSave={handleSaveRule}
            onCancel={() => {
              setEditingRule(null);
              setShowForm(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Règles d'alerte IA</h1>
          <p className="text-slate-500 mt-1">Configurez des alertes personnalisées et découvrez les suggestions de l'IA</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-600">Règles actives</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{activeRules.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-600">Total des règles</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{alertRules.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-600">Critiques</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {alertRules.filter(r => r.severity === 'critical' && r.enabled).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="suggestions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white border border-slate-200">
            <TabsTrigger value="suggestions">
              <Lightbulb className="w-4 h-4 mr-2" />
              Suggestions IA
            </TabsTrigger>
            <TabsTrigger value="rules">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Mes règles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions">
            <div className="mb-6">
              <p className="text-slate-600 text-sm">
                L'IA analyse vos données historiques (emails, réservations, automations) pour suggérer des règles d'alerte optimales.
              </p>
            </div>
            <AIAlertSuggestions />
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle règle
              </Button>
            </div>

            {alertRules.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600">Aucune règle pour le moment</p>
                  <p className="text-sm text-slate-500 mt-1">Créez votre première règle ou acceptez une suggestion</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {alertRules.map(rule => (
                  <Card key={rule.id} className={!rule.enabled ? 'opacity-60' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-slate-900">{rule.name}</h4>
                            <Badge className={`${severityColors[rule.severity]}`}>
                              {rule.severity === 'critical' ? 'Critique' :
                               rule.severity === 'warning' ? 'Avertissement' : 'Info'}
                            </Badge>
                            {!rule.enabled && (
                              <Badge variant="outline" className="bg-slate-100">Inactive</Badge>
                            )}
                            {rule.ai_suggested && (
                              <Badge className="bg-blue-100 text-blue-700">IA</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-2">
                            {conditionLabels[rule.condition_type]}
                          </p>
                          <div className="text-xs text-slate-500 space-y-1">
                            <p>Canaux: {rule.notification_channels?.join(', ')}</p>
                            {rule.trigger_count > 0 && (
                              <p>Déclenchée {rule.trigger_count} fois {rule.last_triggered && `(dernière fois: ${new Date(rule.last_triggered).toLocaleDateString('fr-FR')})`}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setEditingRule(rule)}
                            size="icon"
                            variant="ghost"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => deleteRuleMutation.mutate(rule.id)}
                            size="icon"
                            variant="ghost"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}