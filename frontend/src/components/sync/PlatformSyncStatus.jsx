import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react';

export default function PlatformSyncStatus({ bookingId }) {
  const { data: syncRecords = [] } = useQuery({
    queryKey: ['platformSync', bookingId],
    queryFn: async () => {
      const records = await apiClient.entities.PlatformSync.list('-created_date', 10);
      return records.filter(r => r.booking_id === bookingId);
    },
    enabled: !!bookingId
  });

  if (syncRecords.length === 0) {
    return null;
  }

  const latestSync = syncRecords[0];
  const platformIcons = {
    turo: '🏎️',
    getaround: '🚗',
    hunos_rent: '🚙'
  };

  const statusConfig = {
    success: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: 'Succès' },
    partial_failure: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Succès partiel' },
    syncing: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Synchronisation...' },
    failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Échoué' },
    pending: { icon: Clock, color: 'text-slate-600', bg: 'bg-slate-50', label: 'En attente' }
  };

  const config = statusConfig[latestSync.status];
  const Icon = config.icon;

  return (
    <Card className={`${config.bg} border-0`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${config.color}`} />
            <span className="font-medium text-sm text-slate-900">
              Synchronisation multi-plateforme
            </span>
            <Badge variant="outline" className="ml-auto">{config.label}</Badge>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {latestSync.target_platforms?.map(platform => (
              <div key={platform} className="text-xs">
                <div className="flex items-center gap-1 mb-1">
                  <span>{platformIcons[platform]}</span>
                  <span className="capitalize text-slate-600">{platform}</span>
                </div>
                {latestSync.sync_results?.[platform] && (
                  <p className={`text-xs ${
                    latestSync.sync_results[platform].status === 'success'
                      ? 'text-green-700'
                      : 'text-red-700'
                  }`}>
                    {latestSync.sync_results[platform].status === 'success' ? '✓ Synchro' : '✗ Erreur'}
                  </p>
                )}
              </div>
            ))}
          </div>

          {latestSync.error_message && (
            <p className="text-xs text-red-700">{latestSync.error_message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}