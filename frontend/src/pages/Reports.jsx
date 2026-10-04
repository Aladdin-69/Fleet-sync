import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { BarChart3, Calendar, TrendingUp, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/components/LanguageProvider';
import OccupancyChart from '@/components/reports/OccupancyChart';
import RevenueByPlatformChart from '@/components/reports/RevenueByPlatformChart';
import MaintenanceStats from '@/components/reports/MaintenanceStats';
import BookingDurationChart from '@/components/reports/BookingDurationChart';
import RevenuePerVehicleChart from '@/components/reports/RevenuePerVehicleChart';
import DowntimeChart from '@/components/reports/DowntimeChart';
import AlertFrequencyChart from '@/components/reports/AlertFrequencyChart';
import { subDays, subMonths, startOfDay, endOfDay, format } from 'date-fns';

export default function ReportsPage() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState('30days');
  const [selectedVehicle, setSelectedVehicle] = useState('all');

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case '7days':
        return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
      case '30days':
        return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
      case '3months':
        return { start: startOfDay(subMonths(now, 3)), end: endOfDay(now) };
      case '6months':
        return { start: startOfDay(subMonths(now, 6)), end: endOfDay(now) };
      case '1year':
        return { start: startOfDay(subMonths(now, 12)), end: endOfDay(now) };
      default:
        return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
    }
  };

  const dateRange = getDateRange();

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => apiClient.entities.Vehicle.list()
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => apiClient.entities.Booking.list()
  });

  const { data: revenues = [] } = useQuery({
    queryKey: ['revenues'],
    queryFn: () => apiClient.entities.Revenue.list()
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => apiClient.entities.Alert.list()
  });

  // Filtrer les données par période et véhicule
  const filteredBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.start_date);
    const dateMatch = bookingDate >= dateRange.start && bookingDate <= dateRange.end;
    const vehicleMatch = selectedVehicle === 'all' || booking.vehicle_id === selectedVehicle;
    return dateMatch && vehicleMatch;
  });

  const filteredRevenues = revenues.filter(revenue => {
    const revenueDate = new Date(revenue.date);
    const dateMatch = revenueDate >= dateRange.start && revenueDate <= dateRange.end;
    const vehicleMatch = selectedVehicle === 'all' || revenue.vehicle_id === selectedVehicle;
    return dateMatch && vehicleMatch;
  });

  const filteredVehicles = selectedVehicle === 'all' 
    ? vehicles 
    : vehicles.filter(v => v.id === selectedVehicle);

  // Calculs des KPIs
  const totalRevenue = filteredRevenues.reduce((sum, r) => sum + (r.net_amount || r.amount), 0);
  const totalBookings = filteredBookings.length;
  const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-blue-600" />
              Rapports et Analyses
            </h1>
            <p className="text-slate-500 mt-1">Visualisez les performances de votre flotte</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <SelectTrigger className="w-full sm:w-56">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les véhicules</SelectItem>
                {vehicles.map(vehicle => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-full sm:w-48">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7 derniers jours</SelectItem>
                <SelectItem value="30days">30 derniers jours</SelectItem>
                <SelectItem value="3months">3 derniers mois</SelectItem>
                <SelectItem value="6months">6 derniers mois</SelectItem>
                <SelectItem value="1year">1 an</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-100 text-sm font-medium">Revenu total</p>
              <TrendingUp className="w-5 h-5 text-blue-200" />
            </div>
            <p className="text-3xl font-bold">{totalRevenue.toFixed(2)} €</p>
            <p className="text-blue-100 text-sm mt-2">
              {format(dateRange.start, 'dd MMM')} - {format(dateRange.end, 'dd MMM yyyy')}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 text-sm font-medium">Réservations</p>
              <Calendar className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{totalBookings}</p>
            <p className="text-slate-500 text-sm mt-2">
              {vehicles.length} véhicules actifs
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 text-sm font-medium">Valeur moyenne</p>
              <BarChart3 className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{avgBookingValue.toFixed(2)} €</p>
            <p className="text-slate-500 text-sm mt-2">
              Par réservation
            </p>
          </div>
        </div>

        {/* Section 1: Utilisation des véhicules */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Utilisation des véhicules
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OccupancyChart 
              vehicles={filteredVehicles} 
              bookings={filteredBookings} 
              dateRange={dateRange}
            />
            <BookingDurationChart 
              bookings={filteredBookings} 
              vehicles={filteredVehicles}
            />
          </div>
        </div>

        {/* Section 2: Performance financière */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Performance financière
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenuePerVehicleChart 
              revenues={filteredRevenues} 
              vehicles={filteredVehicles}
            />
            <RevenueByPlatformChart revenues={filteredRevenues} />
          </div>
        </div>

        {/* Section 3: Efficacité opérationnelle */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-600" />
            Efficacité opérationnelle
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <DowntimeChart 
              vehicles={filteredVehicles} 
              bookings={filteredBookings}
              dateRange={dateRange}
            />
            <AlertFrequencyChart 
              alerts={alerts}
              dateRange={dateRange}
            />
          </div>
          <MaintenanceStats vehicles={filteredVehicles} />
        </div>
      </div>
    </div>
  );
}