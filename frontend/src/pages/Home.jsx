import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Car, Mail, AlertTriangle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import SyncStatusCard from '@/components/dashboard/SyncStatusCard';
import StatCard from '@/components/dashboard/StatCard';
import AlertsList from '@/components/dashboard/AlertsList';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { useLanguage } from '@/components/LanguageProvider';
import ProtectedPageWrapper from '@/components/ProtectedPageWrapper';

function HomeContent() {
  const { t } = useLanguage();
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => apiClient.entities.Vehicle.list()
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts', 'active'],
    queryFn: () => apiClient.entities.Alert.filter({ resolved: false }, '-created_date', 10)
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['email-activities'],
    queryFn: () => apiClient.entities.EmailActivity.list('-received_at', 10)
  });

  const { data: syncStatus = [] } = useQuery({
    queryKey: ['sync-status'],
    queryFn: () => apiClient.entities.SyncStatus.list('-created_date', 1)
  });

  const currentStatus = syncStatus[0] || { overall_status: 'healthy' };
  const activeVehicles = vehicles.filter(v => v.status !== 'maintenance').length;
  const bookedVehicles = vehicles.filter(v => v.status === 'booked').length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;

  // Determine overall sync status based on alerts
  let overallStatus = 'healthy';
  if (criticalAlerts > 0) {
    overallStatus = 'critical';
  } else if (alerts.length > 0) {
    overallStatus = 'attention';
  }

  const lastEmail = activities[0]?.received_at 
    ? format(new Date(activities[0].received_at), 'MMM d, HH:mm')
    : t('dashboard.never');

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{t('dashboard.title')}</h1>
          <p className="text-slate-500 mt-1">{t('dashboard.subtitle')}</p>
        </div>

        {/* Sync Status */}
        <SyncStatusCard 
          status={overallStatus}
          lastSync={lastEmail}
          emailsToday={currentStatus.emails_processed_today || activities.length}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <StatCard
            title={t('dashboard.activeVehicles')}
            value={activeVehicles}
            subtitle={`${bookedVehicles} ${t('dashboard.currentlyBooked')}`}
            icon={Car}
          />
          <StatCard
            title={t('dashboard.emailsProcessed')}
            value={activities.length}
            subtitle={t('dashboard.last24h')}
            icon={Mail}
          />
          <StatCard
            title={t('dashboard.activeAlerts')}
            value={alerts.length}
            subtitle={criticalAlerts > 0 ? `${criticalAlerts} ${t('alerts.critical')}` : t('dashboard.noCritical')}
            icon={AlertTriangle}
          />
          <StatCard
            title={t('dashboard.calendarSyncs')}
            value={vehicles.filter(v => v.calendar_provider && v.calendar_provider !== 'none').length}
            subtitle={t('dashboard.calendarsConnected')}
            icon={Calendar}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-8">
          {/* Alerts Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">{t('dashboard.activeAlerts')}</h2>
                {alerts.length > 0 && (
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                    {alerts.length} {t('dashboard.pending')}
                  </span>
                )}
              </div>
              <AlertsList alerts={alerts} compact />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">{t('dashboard.recentActivity')}</h2>
              </div>
              <RecentActivity activities={activities} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { language } = useLanguage();
  return (
    <ProtectedPageWrapper language={language}>
      <HomeContent />
    </ProtectedPageWrapper>
  );
}