import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { AlertTriangle, XCircle, Info, CheckCircle2, Clock, ChevronDown, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import ProtectedPageWrapper from '@/components/ProtectedPageWrapper';

const severityConfig = {
  critical: {
    icon: XCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconColor: 'text-red-500',
    badge: 'bg-red-100 text-red-700'
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconColor: 'text-amber-500',
    badge: 'bg-amber-100 text-amber-700'
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconColor: 'text-blue-500',
    badge: 'bg-blue-100 text-blue-700'
  }
};

const typeLabels = {
  vehicle_unclear: 'Vehicle Name Unclear',
  dates_missing: 'Dates Missing',
  ambiguous_update: 'Ambiguous Booking Update',
  sync_conflict: 'Sync Conflict',
  low_confidence: 'Low Confidence',
  connection_error: 'Connection Error'
};

function AlertsContent() {
  const { t } = useLanguage();
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [expandedAlert, setExpandedAlert] = useState(null);
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => apiClient.entities.Alert.list('-created_date')
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, action }) => apiClient.entities.Alert.update(id, {
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_action: action
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
  });

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && !alert.resolved) ||
      (statusFilter === 'resolved' && alert.resolved);
    return matchesSeverity && matchesStatus;
  });

  const activeCount = alerts.filter(a => !a.resolved).length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.resolved).length;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('alerts.title')}</h1>
            <p className="text-slate-500 mt-1">
              {activeCount > 0 
                ? `${activeCount} ${t('alerts.active')}${activeCount > 1 ? 's' : ''}${criticalCount > 0 ? ` (${criticalCount} ${t('alerts.critical')})` : ''}`
                : t('alerts.noActiveAlerts')}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('alerts.allAlerts')}</SelectItem>
                <SelectItem value="active">{t('alerts.activeOnly')}</SelectItem>
                <SelectItem value="resolved">{t('alerts.resolved')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('alerts.allSeverity')}</SelectItem>
                <SelectItem value="critical">{t('alerts.critical')}</SelectItem>
                <SelectItem value="warning">{t('alerts.warning')}</SelectItem>
                <SelectItem value="info">{t('alerts.info')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Alerts List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-slate-100 rounded w-1/3" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredAlerts.length > 0 ? (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => {
              const config = severityConfig[alert.severity] || severityConfig.warning;
              const Icon = config.icon;
              const isExpanded = expandedAlert === alert.id;
              
              return (
                <div
                  key={alert.id}
                  className={cn(
                    "bg-white rounded-2xl border overflow-hidden transition-all duration-200",
                    alert.resolved ? "border-slate-200 opacity-60" : config.border
                  )}
                >
                  <div 
                    className={cn(
                      "flex items-start gap-4 p-6 cursor-pointer",
                      !alert.resolved && config.bg
                    )}
                    onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                  >
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg",
                      alert.resolved ? "bg-slate-100" : config.bg
                    )}>
                      {alert.resolved ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Icon className={cn("w-5 h-5", config.iconColor)} />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          alert.resolved ? "bg-emerald-100 text-emerald-700" : config.badge
                        )}>
                          {alert.resolved ? t('alerts.resolved') : t(`alerts.${alert.severity}`)}
                        </span>
                        <span className="text-xs text-slate-400">
                          {t(`alertType.${alert.type}`)}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(alert.created_date), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      <h3 className="font-medium text-slate-800 mt-2">{alert.title}</h3>
                      {alert.description && !isExpanded && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-1">{alert.description}</p>
                      )}
                    </div>
                    
                    <ChevronDown className={cn(
                      "w-5 h-5 text-slate-400 transition-transform flex-shrink-0",
                      isExpanded && "rotate-180"
                    )} />
                  </div>
                  
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-slate-100">
                      {alert.description && (
                        <p className="text-sm text-slate-600 mt-4">{alert.description}</p>
                      )}
                      
                      {alert.resolved && alert.resolved_action && (
                        <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                          <p className="text-sm text-emerald-700">
                            <span className="font-medium">{t('alerts.resolution')}:</span> {alert.resolved_action}
                          </p>
                          {alert.resolved_at && (
                            <p className="text-xs text-emerald-600 mt-1">
                              {t('alerts.resolvedOn')} {format(new Date(alert.resolved_at), 'dd MMM yyyy HH:mm')}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {!alert.resolved && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              resolveMutation.mutate({ id: alert.id, action: 'Manually verified and approved' });
                            }}
                            disabled={resolveMutation.isPending}
                          >
                            {t('alerts.markResolved')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              resolveMutation.mutate({ id: alert.id, action: 'Dismissed - no action needed' });
                            }}
                            disabled={resolveMutation.isPending}
                          >
                            {t('alerts.dismiss')}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">{t('alerts.allClear')}</h3>
            <p className="text-slate-500 mt-1">{t('alerts.noMatch')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Alerts() {
  const { language } = useLanguage();
  return (
    <ProtectedPageWrapper language={language}>
      <AlertsContent />
    </ProtectedPageWrapper>
  );
}