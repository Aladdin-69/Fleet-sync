import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Mail, Search, CheckCircle2, XCircle, AlertTriangle, Clock, ChevronDown, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import ProtectedPageWrapper from '@/components/ProtectedPageWrapper';

const platformColors = {
  turo: 'bg-purple-100 text-purple-700',
  getaround: 'bg-cyan-100 text-cyan-700',
  hunos_rent: 'bg-orange-100 text-orange-700',
  unknown: 'bg-slate-100 text-slate-600'
};

function EmailActivityContent() {
  const { t } = useLanguage();
  
  const actionConfig = {
    synced: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', label: t('email.synced') },
    blocked: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: t('email.blocked') },
    pending_review: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', label: t('email.pendingReview') },
    ignored: { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-50', label: t('email.ignored') }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [expandedEmail, setExpandedEmail] = useState(null);

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['email-activities'],
    queryFn: () => apiClient.entities.EmailActivity.list('-received_at', 50)
  });

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.sender?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || activity.action_taken === actionFilter;
    const matchesPlatform = platformFilter === 'all' || activity.platform_detected === platformFilter;
    return matchesSearch && matchesAction && matchesPlatform;
  });

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{t('email.title')}</h1>
          <p className="text-slate-500 mt-1">{t('email.subtitle')}</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={t('email.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('email.allActions')}</SelectItem>
                <SelectItem value="synced">{t('email.synced')}</SelectItem>
                <SelectItem value="blocked">{t('email.blocked')}</SelectItem>
                <SelectItem value="pending_review">{t('email.pendingReview')}</SelectItem>
                <SelectItem value="ignored">{t('email.ignored')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('vehicles.allPlatforms')}</SelectItem>
                <SelectItem value="turo">Turo</SelectItem>
                <SelectItem value="getaround">Getaround</SelectItem>
                <SelectItem value="hunos_rent">Hunos Rent</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Email List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredActivities.length > 0 ? (
          <div className="space-y-3">
            {filteredActivities.map((activity) => {
              const config = actionConfig[activity.action_taken] || actionConfig.ignored;
              const Icon = config.icon;
              const isExpanded = expandedEmail === activity.id;
              
              return (
                <div
                  key={activity.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-200 hover:shadow-sm"
                >
                  <div 
                    className="flex items-center gap-4 p-4 cursor-pointer"
                    onClick={() => setExpandedEmail(isExpanded ? null : activity.id)}
                  >
                    <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0", config.bg)}>
                      <Icon className={cn("w-5 h-5", config.color)} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-slate-800 truncate">{activity.subject || t('email.noSubject')}</p>
                        {activity.platform_detected && (
                          <span className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full capitalize",
                            platformColors[activity.platform_detected]
                          )}>
                            {activity.platform_detected}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        <span className="truncate">{activity.sender}</span>
                        {activity.vehicle_matched && (
                          <>
                            <span>→</span>
                            <span className="truncate">{activity.vehicle_matched}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-slate-400">
                        {activity.received_at ? format(new Date(activity.received_at), 'MMM d, HH:mm') : ''}
                      </p>
                      <p className={cn("text-xs mt-0.5", config.color)}>{config.label}</p>
                    </div>
                    
                    <ChevronDown className={cn(
                      "w-5 h-5 text-slate-400 transition-transform flex-shrink-0",
                      isExpanded && "rotate-180"
                    )} />
                  </div>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-slate-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wide">{t('email.eventType')}</p>
                          <p className="text-sm text-slate-700 mt-1">
                            {activity.event_type ? t(`eventType.${activity.event_type}`) : t('eventType.unknown')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wide">{t('email.confidence')}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  activity.classification_confidence >= 80 ? "bg-emerald-500" :
                                  activity.classification_confidence >= 50 ? "bg-amber-500" : "bg-red-500"
                                )}
                                style={{ width: `${activity.classification_confidence || 0}%` }}
                              />
                            </div>
                            <span className="text-sm text-slate-600">{activity.classification_confidence || 0}%</span>
                          </div>
                        </div>
                      </div>
                      
                      {activity.raw_content_preview && (
                        <div className="mt-4">
                          <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">{t('email.preview')}</p>
                          <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600 font-mono whitespace-pre-wrap">
                            {activity.raw_content_preview}
                          </div>
                        </div>
                      )}
                      
                      {activity.classified_output && (
                        <div className="mt-4">
                          <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">{t('email.classificationOutput')}</p>
                          <div className="p-3 bg-slate-900 rounded-lg text-sm text-slate-100 font-mono whitespace-pre-wrap overflow-x-auto">
                            {typeof activity.classified_output === 'string' 
                              ? activity.classified_output 
                              : JSON.stringify(activity.classified_output, null, 2)}
                          </div>
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
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">{t('email.noEmails')}</h3>
            <p className="text-slate-500 mt-1">
              {activities.length === 0 
                ? t('email.noProcessed')
                : t('email.adjustFilters')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EmailActivity() {
  const { language } = useLanguage();
  return (
    <ProtectedPageWrapper language={language}>
      <EmailActivityContent />
    </ProtectedPageWrapper>
  );
}