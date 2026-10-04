import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { parseISO, isWithinInterval, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { Activity, Award, TrendingUp } from 'lucide-react';

export default function FleetPerformance() {
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

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Performance metrics per vehicle
  const vehiclePerformance = vehicles.map(vehicle => {
    const vehicleBookings = bookings.filter(b => b.vehicle_id === vehicle.id && b.status !== 'cancelled');
    const vehicleMonthlyBookings = vehicleBookings.filter(b => {
      const startDate = parseISO(b.start_date);
      return isWithinInterval(startDate, { start: monthStart, end: monthEnd });
    });

    const vehicleRevenues = revenues.filter(r => r.vehicle_id === vehicle.id);
    const monthlyRevenue = vehicleRevenues
      .filter(r => {
        const revDate = parseISO(r.date);
        return isWithinInterval(revDate, { start: monthStart, end: monthEnd });
      })
      .reduce((sum, r) => sum + (r.net_amount || r.amount), 0);

    // Calculate utilization
    const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
    const bookedDays = vehicleMonthlyBookings.reduce((total, booking) => {
      const start = parseISO(booking.start_date);
      const end = parseISO(booking.end_date);
      return total + (differenceInDays(end, start) || 1);
    }, 0);
    
    const utilizationRate = daysInMonth > 0 ? ((bookedDays / daysInMonth) * 100).toFixed(1) : 0;

    return {
      id: vehicle.id,
      name: vehicle.name,
      status: vehicle.status,
      totalBookings: vehicleBookings.length,
      monthlyBookings: vehicleMonthlyBookings.length,
      monthlyRevenue,
      utilizationRate: parseFloat(utilizationRate),
      bookedDays
    };
  }).sort((a, b) => b.utilizationRate - a.utilizationRate);

  // Fleet-wide metrics
  const totalRevenue = revenues.reduce((sum, r) => sum + (r.net_amount || r.amount), 0);
  const totalBookings = bookings.filter(b => b.status !== 'cancelled').length;
  const avgUtilization = vehiclePerformance.length > 0 
    ? (vehiclePerformance.reduce((sum, v) => sum + v.utilizationRate, 0) / vehiclePerformance.length).toFixed(1)
    : 0;

  const topPerformer = vehiclePerformance.length > 0 ? vehiclePerformance[0] : null;
  const underperformers = vehiclePerformance.filter(v => v.utilizationRate < 20);

  return (
    <div className="space-y-6">
      {/* Fleet Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Véhicules</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{vehicles.length}</p>
              </div>
              <Activity className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Util. moy. (ce mois)</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{avgUtilization}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-600">Meilleur véhicule</p>
                <p className="text-lg font-bold text-slate-900 mt-2 truncate">
                  {topPerformer?.name || 'N/A'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {topPerformer ? `${topPerformer.utilizationRate}% utilisé` : 'N/A'}
                </p>
              </div>
              <Award className="w-10 h-10 text-purple-500 opacity-20 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">À faible utilisation</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{underperformers.length}</p>
                <p className="text-xs text-slate-500 mt-1">moins de 20%</p>
              </div>
              <Activity className="w-10 h-10 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance détaillée par véhicule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Véhicule</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700">Statut</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700">Résa (total)</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700">Résa (mois)</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Revenu (mois)</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700">Utilisation</th>
                </tr>
              </thead>
              <tbody>
                {vehiclePerformance.map((vehicle, idx) => (
                  <tr key={vehicle.id} className={idx % 2 === 0 ? 'bg-slate-50' : ''}>
                    <td className="py-3 px-4 font-medium text-slate-900">{vehicle.name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        vehicle.status === 'available' ? 'bg-green-100 text-green-700' :
                        vehicle.status === 'booked' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600">{vehicle.totalBookings}</td>
                    <td className="py-3 px-4 text-center text-slate-600">{vehicle.monthlyBookings}</td>
                    <td className="py-3 px-4 text-right text-slate-900 font-semibold">{vehicle.monthlyRevenue.toFixed(0)}€</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              vehicle.utilizationRate >= 70 ? 'bg-green-500' :
                              vehicle.utilizationRate >= 40 ? 'bg-blue-500' :
                              'bg-orange-500'
                            }`}
                            style={{width: `${Math.min(vehicle.utilizationRate, 100)}%`}}
                          />
                        </div>
                        <span className="text-xs font-semibold w-8">{vehicle.utilizationRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Underperforming Vehicles Alert */}
      {underperformers.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-base text-orange-900">Véhicules à faible utilisation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {underperformers.map(vehicle => (
                <div key={vehicle.id} className="flex items-center justify-between p-2 bg-white rounded">
                  <span className="text-sm text-slate-700">{vehicle.name}</span>
                  <span className="text-sm font-semibold text-orange-600">{vehicle.utilizationRate}% utilisé</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}