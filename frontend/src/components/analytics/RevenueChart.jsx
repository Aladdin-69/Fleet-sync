import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { parseISO, format, startOfMonth, subMonths } from 'date-fns';
import { useMemo } from 'react';
import { useLanguage } from '@/components/LanguageProvider';

export default function RevenueChart({ revenues }) {
  const { t } = useLanguage();
  const chartData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      months.push({
        month: format(date, 'MMM yyyy'),
        startDate: startOfMonth(date),
        revenue: 0
      });
    }

    revenues.forEach(revenue => {
      const revenueDate = parseISO(revenue.date);
      const monthData = months.find(m => 
        format(m.startDate, 'MMM yyyy') === format(revenueDate, 'MMM yyyy')
      );
      if (monthData) {
        monthData.revenue += revenue.net_amount || revenue.amount;
      }
    });

    return months.map(({ month, revenue }) => ({ month, revenue }));
  }, [revenues]);

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader>
        <CardTitle>{t('analytics.revenueEvolution')}</CardTitle>
        <CardDescription>{t('analytics.revenueEvolutionDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}
              formatter={(value) => [`${value.toFixed(2)}€`, t('analytics.revenueLabel')]}
            />
            <Legend />
            <Bar dataKey="revenue" fill="#3b82f6" name={t('analytics.revenueEuro')} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}