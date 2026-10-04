import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { 
  Calendar, 
  Car, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Wrench,
  Bell,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageProvider';

const notificationIcons = {
  new_booking: { icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
  booking_cancelled: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
  booking_modified: { icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-50' },
  vehicle_status_change: { icon: Car, color: 'text-purple-500', bg: 'bg-purple-50' },
  maintenance_reminder: { icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-50' },
  sync_error: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  alert_created: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' }
};

export default function NotificationPanel({ notifications, onClose }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const markAsReadMutation = useMutation({
    mutationFn: (id) => apiClient.entities.Notification.update(id, { 
      read: true, 
      read_at: new Date().toISOString() 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      await Promise.all(
        unreadIds.map(id => 
          apiClient.entities.Notification.update(id, { 
            read: true, 
            read_at: new Date().toISOString() 
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
      onClose();
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  return (
    <div className="flex flex-col max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div>
          <h3 className="font-semibold text-slate-900">{t('notifications.title')}</h3>
          {unreadNotifications.length > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">
              {t('notifications.unreadCount', { count: unreadNotifications.length })}
            </p>
          )}
        </div>
        {unreadNotifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="text-xs"
          >
            <Check className="w-3 h-3 mr-1" />
            {t('notifications.markAllRead')}
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Bell className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500 text-center">
              {t('notifications.empty')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Unread notifications */}
            {unreadNotifications.map((notification) => {
              const config = notificationIcons[notification.type] || notificationIcons.alert_created;
              const Icon = config.icon;
              
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "p-4 transition-colors cursor-pointer",
                    !notification.read && "bg-blue-50/50 hover:bg-blue-50"
                  )}
                >
                  <div className="flex gap-3">
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0",
                      config.bg
                    )}>
                      <Icon className={cn("w-5 h-5", config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium text-slate-900">
                          {t(`notification.${notification.type}`)}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        {format(parseISO(notification.created_date), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Read notifications */}
            {readNotifications.map((notification) => {
              const config = notificationIcons[notification.type] || notificationIcons.alert_created;
              const Icon = config.icon;
              
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex gap-3">
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0",
                      config.bg,
                      "opacity-60"
                    )}>
                      <Icon className={cn("w-5 h-5", config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-slate-600">
                        {t(`notification.${notification.type}`)}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        {format(parseISO(notification.created_date), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}