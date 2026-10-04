import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, XCircle } from 'lucide-react';

export default function AlertFrequencyChart({ alerts, dateRange }) {
  // Grouper les alertes par véhicule
  const alertsByVehicle = alerts.reduce((acc, alert) => {
    const vehicleId = alert.vehicle_id || 'unknown';
    if (!acc[vehicleId]) {
      acc[vehicleId] = {
        total: 0,
        critical: 0,
        warning: 0,
        info: 0
      };
    }
    acc[vehicleId].total++;
    acc[vehicleId][alert.severity]++;
    return acc;
  }, {});

  // Filtrer les alertes par période
  const filteredAlerts = alerts.filter(alert => {
    const alertDate = new Date(alert.created_date);
    return alertDate >= dateRange.start && alertDate <= dateRange.end;
  });

  // Compter les alertes par type
  const alertsByType = filteredAlerts.reduce((acc, alert) => {
    acc[alert.type] = (acc[alert.type] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(alertsByType)
    .map(([type, count]) => ({
      type: type.replace(/_/g, ' '),
      nombre: count
    }))
    .sort((a, b) => b.nombre - a.nombre)
    .slice(0, 6);

  const totalAlerts = filteredAlerts.length;
  const criticalCount = filteredAlerts.filter(a => a.severity === 'critical').length;

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span>Fréquence des alertes</span>
          <div className="flex items-center gap-3 text-sm font-normal">
            {criticalCount > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <XCircle className="w-4 h-4" />
                <span>{criticalCount} critiques</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-slate-600">
              <AlertTriangle className="w-4 h-4" />
              <span>Total: <span className="font-semibold text-slate-900">{totalAlerts}</span></span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="type" 
                tick={{ fill: '#64748b', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 12 }}
                label={{ value: 'Nombre', angle: -90, position: 'insideLeft', fill: '#64748b' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
                formatter={(value) => [`${value}`, 'Alertes']}
              />
              <Bar dataKey="nombre" fill="#ef4444" radius={[8, 8, 0, 0]} name="Alertes" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-slate-400">
            Aucune alerte dans la période
          </div>
        )}
      </CardContent>
    </Card>
  );
}