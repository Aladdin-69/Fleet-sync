import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DollarSign } from 'lucide-react';

const PLATFORM_COLORS = {
  turo: '#3b82f6',
  getaround: '#8b5cf6',
  hunos_rent: '#10b981',
  manual: '#f59e0b'
};

const PLATFORM_LABELS = {
  turo: 'Turo',
  getaround: 'Getaround',
  hunos_rent: 'Hunos Rent',
  manual: 'Manuel'
};

export default function RevenueByPlatformChart({ revenues }) {
  // Grouper les revenus par plateforme
  const revenueByPlatform = revenues.reduce((acc, revenue) => {
    const platform = revenue.platform;
    const amount = revenue.net_amount || revenue.amount;
    acc[platform] = (acc[platform] || 0) + amount;
    return acc;
  }, {});

  const chartData = Object.entries(revenueByPlatform).map(([platform, amount]) => ({
    name: PLATFORM_LABELS[platform] || platform,
    value: Math.round(amount),
    platform
  }));

  const totalRevenue = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span>Revenus par plateforme</span>
          <div className="flex items-center gap-2 text-sm font-normal">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-slate-600">Total: <span className="font-semibold text-slate-900">{totalRevenue.toFixed(0)} €</span></span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PLATFORM_COLORS[entry.platform]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `${value} €`}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="space-y-3 w-full lg:w-auto">
              {chartData.map((item) => (
                <div key={item.platform} className="flex items-center justify-between gap-8 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: PLATFORM_COLORS[item.platform] }}
                    />
                    <span className="text-sm text-slate-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{item.value} €</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-slate-400">
            Aucune donnée de revenu disponible
          </div>
        )}
      </CardContent>
    </Card>
  );
}