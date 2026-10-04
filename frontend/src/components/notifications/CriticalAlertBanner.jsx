import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { AlertCircle, AlertTriangle, CheckCircle2, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const severityConfig = {
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-900',
    iconColor: 'text-red-600'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-900',
    iconColor: 'text-yellow-600'
  },
  success: {
    icon: CheckCircle2,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-900',
    iconColor: 'text-green-600'
  }
};

export default function CriticalAlertBanner() {
  const [dismissedNotifications, setDismissedNotifications] = useState(new Set());

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['criticalNotifications'],
    queryFn: () => apiClient.entities.Notification.filter({ severity: { $in: ['error', 'warning'] }, read: false }, '-created_date', 10),
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 5000
  });

  useEffect(() => {
    let unsubscribe;

    try {
      unsubscribe = apiClient.entities.Notification.subscribe((event) => {
        if ((event.type === 'create' || event.type === 'update') &&
          (event.data.severity === 'error' || event.data.severity === 'warning') &&
          !event.data.read) {
          // Refetch notifications when a critical one is created
          // useQuery will handle this automatically via invalidation
        }
      });
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
    }

    return () => {
      if (unsubscribe) unsubscribe.unsubscribe();
    };
  }, []);

  const visibleNotifications = notifications?.filter(n => !dismissedNotifications.has(n.id)) || [];

  const handleDismiss = (notificationId) => {
    setDismissedNotifications(prev => new Set(prev).add(notificationId));
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await apiClient.entities.Notification.update(notificationId, {
        read: true,
        read_at: new Date().toISOString()
      });
      handleDismiss(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  if (isLoading || visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-40 p-4 max-w-6xl mx-auto space-y-3 lg:top-20">
      {visibleNotifications.slice(0, 3).map(notification => {
        const config = severityConfig[notification.severity] || severityConfig.warning;
        const Icon = config.icon;

        return (
          <div
            key={notification.id}
            className={`flex items-start gap-3 p-4 rounded-lg border ${config.bgColor} ${config.borderColor} ${config.textColor}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{notification.title}</p>
              <p className="text-sm mt-1 opacity-90">{notification.message}</p>
              {notification.action_url && (
                <Link
                  to={notification.action_url}
                  className="text-sm font-medium mt-2 inline-block hover:underline"
                >
                  Voir les détails →
                </Link>
              )}
            </div>

            <div className="flex gap-2 flex-shrink-0">
              {notification.severity === 'error' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className={`${config.textColor}`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  OK
                </Button>
              )}
              <button
                onClick={() => handleDismiss(notification.id)}
                className={`${config.textColor} hover:opacity-70 transition`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}