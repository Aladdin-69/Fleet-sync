import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Clock } from 'lucide-react';

export default function BookingDurationChart({ bookings, vehicles }) {
  // Calculer la durée moyenne des réservations par véhicule
  const durationData = vehicles.map(vehicle => {
    const vehicleBookings = bookings.filter(b => b.vehicle_id === vehicle.id && b.status !== 'cancelled');
    
    if (vehicleBookings.length === 0) return null;
    
    const totalDuration = vehicleBookings.reduce((sum, booking) => {
      const start = new Date(booking.start_date);
      const end = new Date(booking.end_date);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);
    
    const avgDuration = totalDuration / vehicleBookings.length;
    
    return {
      name: vehicle.name.split(' ').slice(0, 2).join(' '),
      moyenne: Math.round(avgDuration * 10) / 10,
      reservations: vehicleBookings.length
    };
  }).filter(Boolean).sort((a, b) => b.moyenne - a.moyenne).slice(0, 8);

  const overallAvg = durationData.length > 0 
    ? (durationData.reduce((sum, v) => sum + v.moyenne, 0) / durationData.length).toFixed(1)
    : 0;

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span>Durée moyenne des réservations</span>
          <div className="flex items-center gap-2 text-sm font-normal">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-slate-600">Moyenne: <span className="font-semibold text-slate-900">{overallAvg} jours</span></span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {durationData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={durationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#64748b', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 12 }}
                label={{ value: 'Jours', angle: -90, position: 'insideLeft', fill: '#64748b' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
                formatter={(value, name) => {
                  if (name === 'moyenne') return [`${value} jours`, 'Durée moyenne'];
                  if (name === 'reservations') return [`${value}`, 'Réservations'];
                }}
              />
              <Legend />
              <Bar dataKey="moyenne" fill="#6366f1" radius={[8, 8, 0, 0]} name="Durée moyenne (jours)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-slate-400">
            Aucune donnée disponible
          </div>
        )}
      </CardContent>
    </Card>
  );
}