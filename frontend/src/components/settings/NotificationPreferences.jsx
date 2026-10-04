import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Calendar, Car, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/components/LanguageProvider';

export default function NotificationPreferences() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState({
    upcoming_bookings: true,
    vehicle_returns: true,
    booking_status_updates: true,
    sync_errors: true,
    new_alerts: true
  });

  const { data: userPrefs } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const user = await apiClient.auth.me();
      return user.notification_preferences || preferences;
    },
    onSuccess: (data) => {
      if (data) setPreferences(data);
    }
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPrefs) => {
      await apiClient.auth.updateMe({ notification_preferences: newPrefs });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success(t('notifPrefs.saved'));
    }
  });

  const handleToggle = (key) => {
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPrefs);
    updatePreferencesMutation.mutate(newPrefs);
  };

  const notificationTypes = [
    {
      key: 'upcoming_bookings',
      icon: Calendar,
      title: t('notifPrefs.upcomingBookings'),
      description: t('notifPrefs.upcomingBookingsDesc')
    },
    {
      key: 'vehicle_returns',
      icon: Car,
      title: t('notifPrefs.vehicleReturns'),
      description: t('notifPrefs.vehicleReturnsDesc')
    },
    {
      key: 'booking_status_updates',
      icon: AlertTriangle,
      title: t('notifPrefs.statusUpdates'),
      description: t('notifPrefs.statusUpdatesDesc')
    },
    {
      key: 'sync_errors',
      icon: AlertTriangle,
      title: t('notifPrefs.syncErrors'),
      description: t('notifPrefs.syncErrorsDesc')
    },
    {
      key: 'new_alerts',
      icon: Bell,
      title: t('notifPrefs.newAlerts'),
      description: t('notifPrefs.newAlertsDesc')
    }
  ];

  return (
    <Card>
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg">{t('notifPrefs.title')}</CardTitle>
            <CardDescription>{t('notifPrefs.description')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {notificationTypes.map((type) => {
            const Icon = type.icon;
            return (
              <div
                key={type.key}
                className="flex items-start justify-between p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0">
                    <Icon className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={type.key} className="text-sm font-medium text-slate-900 cursor-pointer">
                      {type.title}
                    </Label>
                    <p className="text-xs text-slate-500 mt-1">{type.description}</p>
                  </div>
                </div>
                <Switch
                  id={type.key}
                  checked={preferences[type.key]}
                  onCheckedChange={() => handleToggle(type.key)}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}