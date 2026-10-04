import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, XCircle, AlertTriangle, RotateCw } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

const statusConfig = {
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'En attente' },
  running: { icon: Clock, color: 'bg-blue-100 text-blue-800', label: 'En cours', animate: true },
  success: { icon: CheckCircle2, color: 'bg-green-100 text-green-800', label: 'Succès' },
  failed: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Échec' },
  cancelled: { icon: AlertTriangle, color: 'bg-gray-100 text-gray-800', label: 'Annulé' }
};

export default function AutomationDashboard() {
  const { t } = useLanguage();
  const [selectedLog, setSelectedLog] = useState(null);

  const { data: automationLogs, isLoading } = useQuery({
    queryKey: ['automationLogs'],
    queryFn: () => apiClient.entities.AutomationLog.list('-executed_at', 100),
    initialData: []
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => apiClient.auth.me()
  });

  const handleToggleAutomation = async () => {
    if (currentUser) {
      await apiClient.auth.updateMe({ automation_enabled: !currentUser.automation_enabled });
    }
  };

  const successCount = automationLogs.filter(log => log.status === 'success').length;
  const failedCount = automationLogs.filter(log => log.status === 'failed').length;
  const pendingCount = automationLogs.filter(log => log.status === 'pending' || log.status === 'running').length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Automatisation Cloud</h1>
          <p className="text-sm text-slate-600 mt-1">Gestion des blocages automatiques de dates</p>
        </div>
        <Button
          onClick={handleToggleAutomation}
          variant={currentUser?.automation_enabled ? 'default' : 'destructive'}
        >
          {currentUser?.automation_enabled ? '✓ Activée' : '✗ Désactivée'}
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{successCount}</div>
              <p className="text-sm text-slate-600 mt-1">Automatisations réussies</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{failedCount}</div>
              <p className="text-sm text-slate-600 mt-1">Automatisations échouées</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{pendingCount}</div>
              <p className="text-sm text-slate-600 mt-1">En attente/En cours</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">{automationLogs.length}</div>
              <p className="text-sm text-slate-600 mt-1">Total d'automatisations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des automatisations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-slate-600">Chargement...</p>
          ) : automationLogs.length === 0 ? (
            <p className="text-slate-600">Aucune automatisation enregistrée</p>
          ) : (
            <div className="space-y-3">
              {automationLogs.map((log) => {
                const config = statusConfig[log.status];
                const Icon = config.icon;

                return (
                  <div
                    key={log.id}
                    className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition"
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Icon className={`w-5 h-5 mt-1 ${config.color.split(' ')[1]}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">Véhicule: {log.vehicle_id}</p>
                            <Badge className={`text-xs ${config.color}`}>
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mt-1">
                            Plateforme: <span className="font-medium uppercase">{log.platform}</span>
                          </p>
                          <p className="text-xs text-slate-500 mt-2">
                            {new Date(log.executed_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-900">
                          {new Date(log.start_date).toLocaleDateString('fr-FR')} - {new Date(log.end_date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    {log.manual_review_required && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-yellow-800">Révision manuelle requise</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed View */}
      {selectedLog && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Détails de l'automatisation</CardTitle>
              <button onClick={() => setSelectedLog(null)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Véhicule</p>
                <p className="font-semibold text-slate-900">{selectedLog.vehicle_id}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Plateforme</p>
                <p className="font-semibold text-slate-900 uppercase">{selectedLog.platform}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Statut</p>
                <Badge className={`mt-1 ${statusConfig[selectedLog.status].color}`}>
                  {statusConfig[selectedLog.status].label}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-slate-600">Exécutée le</p>
                <p className="font-semibold text-slate-900">
                  {new Date(selectedLog.executed_at).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>

            {/* Steps */}
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-3">Étapes d'exécution</p>
              <div className="space-y-2">
                {selectedLog.steps?.map((step, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{step.step}</p>
                        <p className="text-sm text-slate-600 mt-1">{step.details}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs ${step.status === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {step.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(step.timestamp).toLocaleTimeString('fr-FR')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {selectedLog.error_message && (
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <p className="font-semibold text-red-900">Erreur</p>
                <p className="text-sm text-red-800 mt-1">{selectedLog.error_message}</p>
                <p className="text-xs text-red-700 mt-2">Type: {selectedLog.error_type}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}