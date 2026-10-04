import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function OccupancyChart({ vehicles, bookings, dateRange }) {
  // Calculer le taux d'occupation par véhicule
  const occupancyData = vehicles.map(vehicle => {
    const vehicleBookings = bookings.filter(b => b.vehicle_id === vehicle.id);
    
    // Calculer les jours totaux dans la période
    const totalDays = Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24));
    
    // Calculer les jours réservés
    let bookedDays = 0;
    vehicleBookings.forEach(booking => {
      const start = new Date(booking.start_date);
      const end = new Date(booking.end_date);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      bookedDays += days;
    });
    
    const occupancyRate = totalDays > 0 ? (bookedDays / totalDays) * 100 : 0;
    
    return {
      name: vehicle.name.split(' ').slice(0, 2).join(' '),
      taux: Math.round(occupancyRate),
      jours: bookedDays
    };
  }).sort((a, b) => b.taux - a.taux).slice(0, 8);

  const avgOccupancy = occupancyData.length > 0 
    ? Math.round(occupancyData.reduce((sum, v) => sum + v.taux, 0) / occupancyData.length)
    : 0;

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span>Taux d'occupation</span>
          <div className="flex items-center gap-2 text-sm font-normal">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-slate-600">Moyenne: <span className="font-semibold text-slate-900">{avgOccupancy}%</span></span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {occupancyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={occupancyData}>
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
                label={{ value: 'Taux (%)', angle: -90, position: 'insideLeft', fill: '#64748b' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
                formatter={(value, name) => {
                  if (name === 'taux') return [`${value}%`, 'Taux d\'occupation'];
                  if (name === 'jours') return [`${value} jours`, 'Jours réservés'];
                }}
              />
              <Legend />
              <Bar dataKey="taux" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Taux (%)" />
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