import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export default function MaintenanceStats({ vehicles }) {
  const maintenanceStats = vehicles.reduce((acc, vehicle) => {
    acc[vehicle.status] = (acc[vehicle.status] || 0) + 1;
    return acc;
  }, {});

  const statusConfig = {
    available: {
      label: 'Disponibles',
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    booked: {
      label: 'Réservés',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    maintenance: {
      label: 'En maintenance',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  };

  const stats = Object.entries(maintenanceStats).map(([status, count]) => ({
    status,
    count,
    ...statusConfig[status]
  }));

  const maintenanceRate = vehicles.length > 0 
    ? ((maintenanceStats.maintenance || 0) / vehicles.length * 100).toFixed(1)
    : 0;

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Statut de la flotte
          </span>
          <Badge variant="outline" className="text-sm">
            Taux de maintenance: {maintenanceRate}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map(({ status, count, label, icon: Icon, color, bgColor, borderColor }) => (
            <div 
              key={status}
              className={`p-6 rounded-xl border-2 ${borderColor} ${bgColor} transition-all hover:shadow-md`}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-6 h-6 ${color}`} />
                <span className={`text-3xl font-bold ${color}`}>{count}</span>
              </div>
              <p className="text-sm font-medium text-slate-700">{label}</p>
              <p className="text-xs text-slate-500 mt-1">
                {((count / vehicles.length) * 100).toFixed(0)}% de la flotte
              </p>
            </div>
          ))}
        </div>

        {vehicles.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            Aucun véhicule dans la flotte
          </div>
        )}
      </CardContent>
    </Card>
  );
}