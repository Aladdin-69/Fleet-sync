import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useLanguage } from '@/components/LanguageProvider';
import { startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';

export default function RevenuePerVehicle() {
  const { t } = useLanguage();

  const { data: revenues = [] } = useQuery({
    queryKey: ['revenues'],
    queryFn: () => apiClient.entities.Revenue.list()
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => apiClient.entities.Vehicle.list()
  });

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Revenue by vehicle for current month
  const revenueByVehicle = {};
  const monthlyRevenueByVehicle = {};

  revenues.forEach(rev => {
    const vehicleId = rev.vehicle_id;
    const amount = rev.net_amount || rev.amount;
    
    revenueByVehicle[vehicleId] = (revenueByVehicle[vehicleId] || 0) + amount;

    const revDate = parseISO(rev.date);
    if (isWithinInterval(revDate, { start: monthStart, end: monthEnd })) {
      monthlyRevenueByVehicle[vehicleId] = (monthlyRevenueByVehicle[vehicleId] || 0) + amount;
    }
  });

  // Enrich with vehicle data
  const vehicleRevenueData = vehicles
    .map(v => ({
      id: v.id,
      name: v.name,
      total: revenueByVehicle[v.id] || 0,
      monthly: monthlyRevenueByVehicle[v.id] || 0
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Monthly trends
  const monthlyTrends = {};
  revenues.forEach(rev => {
    const revDate = parseISO(rev.date);
    const month = `${revDate.getMonth() + 1}/${revDate.getFullYear()}`;
    const amount = rev.net_amount || rev.amount;
    monthlyTrends[month] = (monthlyTrends[month] || 0) + amount;
  });

  const trendData = Object.entries(monthlyTrends)
    .sort(([a], [b]) => {
      const [monthA, yearA] = a.split('/').map(Number);
      const [monthB, yearB] = b.split('/').map(Number);
      return yearA - yearB || monthA - monthB;
    })
    .slice(-6)
    .map(([period, amount]) => ({ period, revenue: amount }));

  const totalRevenue = Object.values(revenueByVehicle).reduce((a, b) => a + b, 0);
  const avgPerVehicle = vehicles.length > 0 ? (totalRevenue / vehicles.length).toFixed(0) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-600">Revenu total</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{totalRevenue.toFixed(0)}€</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-600">Revenu moyen par véhicule</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{avgPerVehicle}€</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-600">Meilleur véhicule</p>
            <p className="text-2xl font-bold text-slate-900 mt-2 truncate">
              {vehicleRevenueData.length > 0 ? vehicleRevenueData[0].name : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Line */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tendance des revenus (6 derniers mois)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toFixed(0)}€`} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={{ fill: '#22c55e', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Revenue by Vehicle */}
      {vehicleRevenueData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 10 véhicules par revenu</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vehicleRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => `${value.toFixed(0)}€`}
                  labelFormatter={(label) => `Total: ${label}`}
                />
                <Bar dataKey="monthly" fill="#3b82f6" name="Ce mois" radius={[8, 8, 0, 0]} />
                <Bar dataKey="total" fill="#10b981" name="Total" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}