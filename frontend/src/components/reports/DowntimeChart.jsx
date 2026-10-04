import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, AlertTriangle } from 'lucide-react';

export default function DowntimeChart({ vehicles, bookings, dateRange }) {
  // Calculer le temps d'immobilisation (jours non réservés) par véhicule
  const downtimeData = vehicles.map(vehicle => {
    const vehicleBookings = bookings.filter(b => b.vehicle_id === vehicle.id && b.status !== 'cancelled');
    
    const totalDays = Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24));
    
    let bookedDays = 0;
    vehicleBookings.forEach(booking => {
      const start = new Date(booking.start_date);
      const end = new Date(booking.end_date);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      bookedDays += days;
    });
    
    const downtime = totalDays - bookedDays;
    const downtimeRate = totalDays > 0 ? (downtime / totalDays) * 100 : 0;
    
    return {
      name: vehicle.name.split(' ').slice(0, 2).join(' '),
      jours: downtime,
      taux: Math.round(downtimeRate),
      status: vehicle.status
    };
  }).sort((a, b) => b.jours - a.jours).slice(0, 8);

  const avgDowntime = downtimeData.length > 0 
    ? Math.round(downtimeData.reduce((sum, v) => sum + v.jours, 0) / downtimeData.length)
    : 0;

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span>Temps d'immobilisation</span>
          <div className="flex items-center gap-2 text-sm font-normal">
            <Clock className="w-4 h-4 text-orange-600" />
            <span className="text-slate-600">Moyenne: <span className="font-semibold text-slate-900">{avgDowntime} jours</span></span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {downtimeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={downtimeData}>
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
                  if (name === 'jours') return [`${value} jours`, 'Jours non réservés'];
                  if (name === 'taux') return [`${value}%`, 'Taux d\'immobilisation'];
                }}
              />
              <Bar dataKey="jours" fill="#f59e0b" radius={[8, 8, 0, 0]} name="Jours non réservés" />
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