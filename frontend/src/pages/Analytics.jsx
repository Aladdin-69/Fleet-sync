import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { TrendingUp, DollarSign, Calendar, Car, BarChart3, AlertTriangle, Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MetricsCard from '@/components/analytics/MetricsCard';
import RevenueChart from '@/components/analytics/RevenueChart';
import UtilizationChart from '@/components/analytics/UtilizationChart';
import PlatformChart from '@/components/analytics/PlatformChart';
import FleetPerformance from '@/components/analytics/FleetPerformance';
import RevenuePerVehicle from '@/components/analytics/RevenuePerVehicle';
import AutomationErrorsAnalysis from '@/components/analytics/AutomationErrorsAnalysis';
import PredictiveAnalytics from '@/components/analytics/PredictiveAnalytics';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { useLanguage } from '@/components/LanguageProvider';
import ProtectedPageWrapper from '@/components/ProtectedPageWrapper';

function AnalyticsContent() {
  const { t } = useLanguage();
  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => apiClient.entities.Booking.list()
  });

  const { data: revenues = [] } = useQuery({
    queryKey: ['revenues'],
    queryFn: () => apiClient.entities.Revenue.list()
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => apiClient.entities.Vehicle.list()
  });

  // Calculate metrics
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);

  const totalBookings = bookings.filter(b => b.status !== 'cancelled').length;
  
  const monthlyRevenue = revenues
    .filter(r => {
      const date = parseISO(r.date);
      return isWithinInterval(date, { start: monthStart, end: monthEnd });
    })
    .reduce((sum, r) => sum + (r.net_amount || r.amount), 0);

  const weeklyRevenue = revenues
    .filter(r => {
      const date = parseISO(r.date);
      return isWithinInterval(date, { start: weekStart, end: weekEnd });
    })
    .reduce((sum, r) => sum + (r.net_amount || r.amount), 0);

  const activeBookings = bookings.filter(b => b.status === 'in_progress').length;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{t('analytics.title')}</h1>
          <p className="text-slate-500 mt-1">{t('analytics.subtitle')}</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricsCard
            title={t('analytics.totalBookings')}
            value={totalBookings}
            icon={Calendar}
            color="blue"
          />
          <MetricsCard
            title={t('analytics.monthlyRevenue')}
            value={`${monthlyRevenue.toFixed(0)}€`}
            icon={DollarSign}
            color="green"
          />
          <MetricsCard
            title={t('analytics.weeklyRevenue')}
            value={`${weeklyRevenue.toFixed(0)}€`}
            icon={TrendingUp}
            color="indigo"
          />
          <MetricsCard
            title={t('analytics.activeBookings')}
            value={activeBookings}
            icon={Car}
            color="purple"
          />
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="fleet" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 bg-white border border-slate-200">
            <TabsTrigger value="fleet" title="Performance flotte">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Flotte</span>
            </TabsTrigger>
            <TabsTrigger value="revenue" title="Revenus">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Revenus</span>
            </TabsTrigger>
            <TabsTrigger value="utilization" title="Utilisation">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Util.</span>
            </TabsTrigger>
            <TabsTrigger value="platforms" title="Plateformes">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Plat.</span>
            </TabsTrigger>
            <TabsTrigger value="vehicle-revenue" title="Revenus par véhicule">
              <Car className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Véh.</span>
            </TabsTrigger>
            <TabsTrigger value="errors" title="Erreurs d'automatisation">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Err.</span>
            </TabsTrigger>
            <TabsTrigger value="predictions" title="Prévisions">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Prév.</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fleet">
            <FleetPerformance />
          </TabsContent>

          <TabsContent value="revenue">
            <RevenueChart revenues={revenues} />
          </TabsContent>

          <TabsContent value="utilization">
            <UtilizationChart bookings={bookings} vehicles={vehicles} />
          </TabsContent>

          <TabsContent value="platforms">
            <PlatformChart bookings={bookings} />
          </TabsContent>

          <TabsContent value="vehicle-revenue">
            <RevenuePerVehicle />
          </TabsContent>

          <TabsContent value="errors">
            <AutomationErrorsAnalysis />
          </TabsContent>

          <TabsContent value="predictions">
            <PredictiveAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function Analytics() {
  const { language } = useLanguage();
  return (
    <ProtectedPageWrapper language={language}>
      <AnalyticsContent />
    </ProtectedPageWrapper>
  );
}