import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import { format, subDays, parseISO } from 'date-fns';

export default function AutomationErrorsAnalysis() {
  const { t } = useLanguage();
  
  const { data: automationLogs = [] } = useQuery({
    queryKey: ['automationLogs'],
    queryFn: () => apiClient.entities.AutomationLog.list('-executed_at', 500)
  });

  // Error frequency by type over 30 days
  const last30Days = automationLogs.filter(log => {
    if (!log.executed_at) return false;
    const logDate = parseISO(log.executed_at);
    return logDate >= subDays(new Date(), 30);
  });

  const errorsByType = {};
  const errorsByPlatform = {};
  const dailyErrors = {};

  last30Days.forEach(log => {
    if (log.error_type) {
      errorsByType[log.error_type] = (errorsByType[log.error_type] || 0) + 1;
    }
    if (log.status === 'failed') {
      errorsByPlatform[log.platform] = (errorsByPlatform[log.platform] || 0) + 1;
      
      const day = format(parseISO(log.executed_at), 'MMM dd');
      dailyErrors[day] = (dailyErrors[day] || 0) + 1;
    }
  });

  const errorTypeData = Object.entries(errorsByType).map(([type, count]) => ({
    name: type.replace('_', ' ').toUpperCase(),
    value: count
  }));

  const platformErrorData = Object.entries(errorsByPlatform).map(([platform, count]) => ({
    name: platform.charAt(0).toUpperCase() + platform.slice(1),
    value: count
  }));

  const dailyErrorData = Object.entries(dailyErrors)
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .map(([day, count]) => ({ day, errors: count }));

  const totalErrors = last30Days.filter(l => l.status === 'failed').length;
  const errorRate = last30Days.length > 0 ? ((totalErrors / last30Days.length) * 100).toFixed(1) : 0;

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

  return (
    <div className="space-y-6">
      {/* Error Rate Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Taux d'erreur (30j)</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{errorRate}%</p>
                <p className="text-xs text-slate-500 mt-1">{totalErrors} erreurs sur {last30Days.length} tentatives</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Plateforme la plus affectée</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {platformErrorData.length > 0 ? platformErrorData[0].name : 'N/A'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {platformErrorData.length > 0 ? `${platformErrorData[0].value} erreurs` : 'Pas d\'erreurs'}
                </p>
              </div>
              <TrendingDown className="w-10 h-10 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Timeline */}
      {dailyErrorData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Évolution des erreurs (30 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyErrorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="errors" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Error Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {errorTypeData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Erreurs par type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={errorTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {errorTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {platformErrorData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Erreurs par plateforme</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={platformErrorData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Common Errors List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Erreurs récurrentes (Top 5)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {errorTypeData.slice(0, 5).map((error, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">{error.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{width: `${(error.value / totalErrors) * 100}%`}}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 w-10">{error.value}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}