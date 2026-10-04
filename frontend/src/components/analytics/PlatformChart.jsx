import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import { useLanguage } from '@/components/LanguageProvider';

const COLORS = {
  turo: '#a855f7',
  getaround: '#06b6d4',
  hunos_rent: '#f97316',
  manual: '#64748b'
};

export default function PlatformChart({ bookings }) {
  const { t } = useLanguage();
  
  const chartData = useMemo(() => {
    const platformCounts = bookings
      .filter(b => b.status !== 'cancelled')
      .reduce((acc, booking) => {
        acc[booking.platform] = (acc[booking.platform] || 0) + 1;
        return acc;
      }, {});

    return Object.entries(platformCounts).map(([platform, count]) => ({
      name: platform.replace('_', ' ').charAt(0).toUpperCase() + platform.replace('_', ' ').slice(1),
      value: count,
      color: COLORS[platform]
    }));
  }, [bookings]);

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader>
        <CardTitle>{t('analytics.platformDistribution')}</CardTitle>
        <CardDescription>{t('analytics.platformDistributionDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}