import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';

const statusConfig = {
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'En attente' },
  running: { icon: Clock, color: 'bg-blue-100 text-blue-800', label: 'En cours' },
  success: { icon: CheckCircle2, color: 'bg-green-100 text-green-800', label: 'Succès' },
  failed: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Échoué' },
  cancelled: { icon: XCircle, color: 'bg-slate-100 text-slate-800', label: 'Annulé' }
};

export default function AutomationLogsList() {
  const [expandedId, setExpandedId] = useState(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['automationLogs'],
    queryFn: () => apiClient.entities.AutomationLog.list('-created_date', 50)
  });

  if (isLoading) return <div className="text-center py-8">Chargement...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Historique d'automatisation</h3>

      {!logs || logs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            Aucun enregistrement d'automatisation
          </CardContent>
        </Card>
      ) : (
        logs.map((log) => {
          const config = statusConfig[log.status];
          const Icon = config.icon;

          return (
            <Card
              key={log.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={`w-5 h-5 ${config.color.split(' ')[1]}`} />
                      <div>
                        <p className="font-medium">
                          {log.vehicle_id} • {log.platform.toUpperCase()}
                        </p>
                        <p className="text-sm text-slate-500">
                          {format(new Date(log.created_date), 'd MMM yyyy HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {log.manual_review_required && (
                      <Badge variant="destructive">Révision requise</Badge>
                    )}
                    <Badge className={config.color}>{config.label}</Badge>
                  </div>
                </div>

                {expandedId === log.id && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    {log.error_message && (
                      <div className="bg-red-50 p-3 rounded text-sm text-red-700">
                        <p className="font-medium">Erreur: {log.error_type}</p>
                        <p>{log.error_message}</p>
                      </div>
                    )}

                    {log.steps && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Étapes:</p>
                        {log.steps.map((step, idx) => (
                          <div key={idx} className="text-xs bg-slate-50 p-2 rounded flex gap-2">
                            <span className={`mt-0.5 ${step.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                              {step.status === 'success' ? '✓' : '✗'}
                            </span>
                            <div>
                              <p className="font-medium">{step.step}</p>
                              <p className="text-slate-600">{step.details}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-slate-500">
                      Dates: {format(new Date(log.start_date), 'd MMM')} → {format(new Date(log.end_date), 'd MMM')}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}