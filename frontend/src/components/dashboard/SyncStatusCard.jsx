import { CheckCircle2, AlertTriangle, XCircle, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';

export default function SyncStatusCard({ status = 'healthy', lastSync, emailsToday }) {
  const { t } = useLanguage();
  
  const statusConfig = {
    healthy: {
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      label: t('dashboard.allSynced'),
      description: t('dashboard.allRunning')
    },
    attention: {
      icon: AlertTriangle,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      label: t('dashboard.attentionRequired'),
      description: t('dashboard.needsReview')
    },
    critical: {
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-50',
      border: 'border-red-200',
      label: t('dashboard.criticalIssue'),
      description: t('dashboard.immediateAction')
    }
  };
  
  const config = statusConfig[status] || statusConfig.healthy;
  const Icon = config.icon;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border p-6 transition-all duration-300",
      config.bg,
      config.border
    )}>
      <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-10">
        <Icon className="w-full h-full" />
      </div>
      
      <div className="flex items-start gap-4">
        <div className={cn(
          "flex items-center justify-center w-14 h-14 rounded-xl",
          status === 'healthy' ? 'bg-emerald-100' : status === 'attention' ? 'bg-amber-100' : 'bg-red-100'
        )}>
          <Icon className={cn("w-7 h-7", config.color)} />
        </div>
        
        <div className="flex-1">
          <h3 className={cn("text-lg font-semibold", config.color)}>{config.label}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{config.description}</p>
          
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Wifi className="w-4 h-4" />
              <span>{t('dashboard.lastSync')} {lastSync || t('dashboard.never')}</span>
            </div>
            {emailsToday !== undefined && (
              <div className="text-sm text-slate-600">
                <span className="font-medium">{emailsToday}</span> {t('dashboard.emailsToday')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}