import { Mail, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useLanguage } from '@/components/LanguageProvider';

const actionConfig = {
  synced: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  blocked: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
  pending_review: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
  ignored: { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-50' }
};

const platformColors = {
  turo: 'bg-purple-100 text-purple-700',
  getaround: 'bg-cyan-100 text-cyan-700',
  hunos_rent: 'bg-orange-100 text-orange-700',
  unknown: 'bg-slate-100 text-slate-600'
};

export default function RecentActivity({ activities = [] }) {
  const { t } = useLanguage();
  
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">{t('dashboard.noRecentActivity')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity, index) => {
        const config = actionConfig[activity.action_taken] || actionConfig.ignored;
        const Icon = config.icon;
        
        return (
          <div
            key={activity.id}
            className="flex items-start sm:items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
          >
            <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0", config.bg)}>
              <Icon className={cn("w-5 h-5", config.color)} />
            </div>
            
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-slate-800 truncate">{activity.subject}</p>
                {activity.platform_detected && activity.platform_detected !== 'unknown' && (
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full capitalize flex-shrink-0",
                    platformColors[activity.platform_detected]
                  )}>
                    {activity.platform_detected}
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-0.5">
                <span className="text-sm text-slate-400 truncate">{activity.sender}</span>
                {activity.vehicle_matched && (
                  <span className="text-sm text-slate-500 truncate">→ {activity.vehicle_matched}</span>
                )}
              </div>
            </div>
            
            <div className="text-right flex-shrink-0 min-w-[60px]">
              <p className="text-sm text-slate-400 whitespace-nowrap">
                {activity.received_at ? format(new Date(activity.received_at), 'HH:mm') : ''}
              </p>
              {activity.classification_confidence && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {activity.classification_confidence}%
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}