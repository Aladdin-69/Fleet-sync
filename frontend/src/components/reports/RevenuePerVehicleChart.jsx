import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign } from 'lucide-react';

export default function RevenuePerVehicleChart({ revenues, vehicles }) {
  // Calculer les revenus par véhicule
  const revenueData = vehicles.map(vehicle => {
    const vehicleRevenues = revenues.filter(r => r.vehicle_id === vehicle.id);
    
    const totalRevenue = vehicleRevenues.reduce((sum, r) => sum + (r.net_amount || r.amount), 0);
    const totalCost = vehicleRevenues.reduce((sum, r) => sum + (r.commission || 0), 0);
    
    if (totalRevenue === 0) return null;
    
    return {
      name: vehicle.name.split(' ').slice(0, 2).join(' '),
      revenu: Math.round(totalRevenue),
      cout: Math.round(totalCost),
      net: Math.round(totalRevenue - totalCost)
    };
  }).filter(Boolean).sort((a, b) => b.revenu - a.revenu).slice(0, 8);

  const totalRevenue = revenueData.reduce((sum, v) => sum + v.revenu, 0);

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span>Revenus par véhicule</span>
          <div className="flex items-center gap-2 text-sm font-normal">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-slate-600">Total: <span className="font-semibold text-slate-900">{totalRevenue} €</span></span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
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
                label={{ value: 'Montant (€)', angle: -90, position: 'insideLeft', fill: '#64748b' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
                formatter={(value, name) => {
                  if (name === 'revenu') return [`${value} €`, 'Revenu brut'];
                  if (name === 'cout') return [`${value} €`, 'Commissions'];
                  if (name === 'net') return [`${value} €`, 'Revenu net'];
                }}
              />
              <Legend />
              <Bar dataKey="revenu" fill="#10b981" radius={[8, 8, 0, 0]} name="Revenu brut" />
              <Bar dataKey="cout" fill="#f59e0b" radius={[8, 8, 0, 0]} name="Commissions" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-slate-400">
            Aucune donnée de revenu disponible
          </div>
        )}
      </CardContent>
    </Card>
  );
}