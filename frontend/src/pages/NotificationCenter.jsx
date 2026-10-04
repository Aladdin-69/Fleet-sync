import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, AlertTriangle, Clock, Trash2, Settings, Bell, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import NotificationPreferencesModal from '@/components/notifications/NotificationPreferencesModal';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ProtectedPageWrapper from '@/components/ProtectedPageWrapper';
import { useLanguage } from '@/components/LanguageProvider';

const severityConfig = {
  error: { icon: AlertCircle, color: 'bg-red-100 text-red-800', label: 'Erreur' },
  warning: { icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800', label: 'Avertissement' },
  info: { icon: Clock, color: 'bg-blue-100 text-blue-800', label: 'Info' },
  success: { icon: CheckCircle2, color: 'bg-green-100 text-green-800', label: 'Succès' }
};

function NotificationCenterContent() {
  const queryClient = useQueryClient();
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['allNotifications'],
    queryFn: () => apiClient.entities.Notification.list('-created_date', 100),
    initialData: []
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId) => apiClient.entities.Notification.delete(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allNotifications'] });
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) =>
      apiClient.entities.Notification.update(notificationId, {
        read: true,
        read_at: new Date().toISOString()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allNotifications'] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifications = notifications?.filter(n => !n.read) || [];
      await Promise.all(
        unreadNotifications.map(n =>
          apiClient.entities.Notification.update(n.id, {
            read: true,
            read_at: new Date().toISOString()
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allNotifications'] });
    }
  });

  useEffect(() => {
    let unsubscribe;

    try {
      unsubscribe = apiClient.entities.Notification.subscribe((event) => {
        if (event.type === 'create' || event.type === 'update') {
          queryClient.invalidateQueries({ queryKey: ['allNotifications'] });
        }
      });
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
    }

    return () => {
      if (unsubscribe) unsubscribe.unsubscribe();
    };
  }, [queryClient]);

  const unreadNotifications = notifications?.filter(n => !n.read) || [];
  const readNotifications = notifications?.filter(n => n.read) || [];
  const criticalNotifications = notifications?.filter(n => n.severity === 'error') || [];

  const renderNotificationItem = (notification) => {
    const config = severityConfig[notification.severity] || severityConfig.info;
    const Icon = config.icon;

    return (
      <Card key={notification.id} className={notification.read ? 'opacity-60' : 'border-l-4 border-l-blue-500'}>
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.color.split(' ')[1]}`} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-sm">{notification.title}</p>
                <Badge className={config.color} variant="outline">
                  {config.label}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 mb-2">{notification.message}</p>

              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>{format(new Date(notification.created_date), 'dd MMM yyyy HH:mm', { locale: fr })}</span>
                {notification.action_url && (
                  <Link to={notification.action_url} className="text-blue-600 hover:underline font-medium">
                    Voir les détails
                  </Link>
                )}
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              {!notification.read && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => markAsReadMutation.mutate(notification.id)}
                  disabled={markAsReadMutation.isPending}
                >
                  Lire
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteNotificationMutation.mutate(notification.id)}
                disabled={deleteNotificationMutation.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-600" />
              Centre de Notifications
            </h1>
            <p className="text-slate-600 mt-2">Gérez et consultez toutes vos notifications</p>
          </div>
          <Button onClick={() => setPreferencesOpen(true)} variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Préférences
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{criticalNotifications.length}</div>
                <p className="text-sm text-slate-600 mt-1">Alertes critiques</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{unreadNotifications.length}</div>
                <p className="text-sm text-slate-600 mt-1">Non lues</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">{notifications?.length || 0}</div>
                <p className="text-sm text-slate-600 mt-1">Total</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="unread" className="w-full">
          <TabsList>
            <TabsTrigger value="unread">
              Non lues ({unreadNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="critical">
              Critiques ({criticalNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="all">Tous</TabsTrigger>
          </TabsList>

          <TabsContent value="unread" className="space-y-4">
            {unreadNotifications.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-slate-500">
                  Aucune notification non lue
                </CardContent>
              </Card>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                  className="w-full"
                >
                  Marquer tout comme lu
                </Button>
                {unreadNotifications.map(renderNotificationItem)}
              </>
            )}
          </TabsContent>

          <TabsContent value="critical" className="space-y-4">
            {criticalNotifications.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-slate-500">
                  Aucune alerte critique
                </CardContent>
              </Card>
            ) : (
              criticalNotifications.map(renderNotificationItem)
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {notifications?.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-slate-500">
                  Aucune notification
                </CardContent>
              </Card>
            ) : (
              notifications.map(renderNotificationItem)
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
      />
    </div>
  );
}

export default function NotificationCenter() {
  const { language } = useLanguage();
  return (
    <ProtectedPageWrapper language={language}>
      <NotificationCenterContent />
    </ProtectedPageWrapper>
  );
}