import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { parseISO, differenceInDays, startOfMonth, endOfMonth } from 'date-fns';
import { useMemo } from 'react';
import { useLanguage } from '@/components/LanguageProvider';

export default function UtilizationChart({ bookings, vehicles }) {
  const { t } = useLanguage();
  const chartData = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;

    return vehicles.map(vehicle => {
      const vehicleBookings = bookings.filter(b => 
        b.vehicle_id === vehicle.id && b.status !== 'cancelled'
      );

      let bookedDays = 0;
      vehicleBookings.forEach(booking => {
        const start = parseISO(booking.start_date);
        const end = parseISO(booking.end_date);
        
        const bookingStart = start < monthStart ? monthStart : start;
        const bookingEnd = end > monthEnd ? monthEnd : end;
        
        if (bookingStart <= monthEnd && bookingEnd >= monthStart) {
          bookedDays += differenceInDays(bookingEnd, bookingStart) + 1;
        }
      });

      const utilization = Math.min((bookedDays / daysInMonth) * 100, 100);

      return {
        name: vehicle.name.length > 20 ? vehicle.name.substring(0, 20) + '...' : vehicle.name,
        utilization: parseFloat(utilization.toFixed(1))
      };
    });
  }, [bookings, vehicles]);

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader>
        <CardTitle>{t('analytics.utilizationRate')}</CardTitle>
        <CardDescription>{t('analytics.utilizationRateDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis type="category" dataKey="name" width={150} tick={{ fill: '#64748b', fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}
              formatter={(value) => [`${value}%`, t('analytics.utilizationLabel')]}
            />
            <Legend />
            <Bar dataKey="utilization" fill="#8b5cf6" name={t('analytics.utilizationPercent')} radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}