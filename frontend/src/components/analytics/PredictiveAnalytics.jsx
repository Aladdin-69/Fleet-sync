import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Target } from 'lucide-react';
import { parseISO, startOfMonth, endOfMonth, isWithinInterval, addMonths } from 'date-fns';

export default function PredictiveAnalytics() {
  const { data: revenues = [] } = useQuery({
    queryKey: ['revenues'],
    queryFn: () => apiClient.entities.Revenue.list()
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => apiClient.entities.Booking.list()
  });

  // Calculate monthly revenue trend
  const monthlyData = {};
  revenues.forEach(rev => {
    const revDate = parseISO(rev.date);
    const monthKey = `${revDate.getFullYear()}-${String(revDate.getMonth() + 1).padStart(2, '0')}`;
    const amount = rev.net_amount || rev.amount;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + amount;
  });

  const historicalData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => {
      const [year, monthNum] = month.split('-');
      return { month: `${monthNum}/${year}`, revenue };
    });

  // Simple linear regression for prediction
  const predictFutureMonths = (data, months = 3) => {
    if (data.length < 2) return [];
    
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data.map(d => d.revenue);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const predictions = [];
    for (let i = 1; i <= months; i++) {
      const futureX = n + i - 1;
      const predictedRevenue = Math.max(0, intercept + slope * futureX);
      predictions.push({
        month: `+${i}m`,
        revenue: predictedRevenue,
        isPrediction: true
      });
    }
    return predictions;
  };

  const predictions = predictFutureMonths(historicalData, 3);
  const combinedData = [...historicalData, ...predictions];

  // Booking trend
  const monthlyBookings = {};
  bookings.forEach(b => {
    if (b.start_date) {
      const date = parseISO(b.start_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyBookings[monthKey] = (monthlyBookings[monthKey] || 0) + 1;
    }
  });

  const bookingData = Object.entries(monthlyBookings)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => {
      const [year, monthNum] = month.split('-');
      return { month: `${monthNum}/${year}`, bookings: count };
    });

  const avgMonthlyRevenue = historicalData.length > 0 
    ? (historicalData.reduce((sum, d) => sum + d.revenue, 0) / historicalData.length).toFixed(0)
    : 0;

  const projectedAnnualRevenue = historicalData.length > 0
    ? (avgMonthlyRevenue * 12).toFixed(0)
    : 0;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Revenu moyen/mois</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{avgMonthlyRevenue}€</p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Projection annuelle</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{projectedAnnualRevenue}€</p>
              </div>
              <Target className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Réservations total</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{bookings.length}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-indigo-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Forecast */}
      {combinedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prévision des revenus</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={combinedData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPrediction" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => `${value.toFixed(0)}€`}
                  labelFormatter={(label) => `${label}${combinedData.find(d => d.month === label)?.isPrediction ? ' (prévision)' : ''}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-500 mt-4">
              * Les 3 derniers mois sont des prévisions basées sur la tendance historique
            </p>
          </CardContent>
        </Card>
      )}

      {/* Booking Trend */}
      {bookingData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tendance des réservations</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={bookingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="bookings" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}