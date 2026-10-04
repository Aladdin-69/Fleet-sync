import { AlertTriangle, XCircle, Info, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageProvider';

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

export default function AlertsList({ alerts = [], compact = false }) {
  const { t } = useLanguage();
  
  if (!alerts || alerts.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">{t('dashboard.noActiveAlerts')}</p>
      </div>
    );
  }

  const displayAlerts = compact ? alerts.slice(0, 3) : alerts;

  return (
    <div className="space-y-3">
      {displayAlerts.map((alert) => {
        const config = severityConfig[alert.severity] || severityConfig.warning;
        const Icon = config.icon;
        
        return (
          <div
            key={alert.id}
            className={cn(
              "flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 hover:shadow-sm",
              config.bg,
              config.border
            )}
          >
            <Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", config.iconColor)} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", config.badge)}>
                  {t(`alerts.${alert.severity}`)}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(alert.created_date), 'MMM d, HH:mm')}
                </span>
              </div>
              <h4 className="font-medium text-slate-800 mt-1">{alert.title}</h4>
              {!compact && alert.description && (
                <p className="text-sm text-slate-500 mt-1">{alert.description}</p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
          </div>
        );
      })}
      
      {compact && alerts.length > 3 && (
        <Link to={createPageUrl('Alerts')}>
          <Button variant="ghost" className="w-full text-slate-500 hover:text-slate-700">
            Voir toutes les alertes ({alerts.length})
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      )}
    </div>
  );
}