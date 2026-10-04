import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Bell, Calendar, Car, AlertTriangle, Wrench, Check, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import ProtectedPageWrapper from '@/components/ProtectedPageWrapper';

const notificationConfig = {
  new_booking: { 
    icon: Calendar, 
    color: 'text-blue-500', 
    bg: 'bg-blue-50', 
    label: 'Nouvelle réservation' 
  },
  booking_cancelled: { 
    icon: AlertTriangle, 
    color: 'text-red-500', 
    bg: 'bg-red-50', 
    label: 'Réservation annulée' 
  },
  booking_modified: { 
    icon: Calendar, 
    color: 'text-amber-500', 
    bg: 'bg-amber-50', 
    label: 'Réservation modifiée' 
  },
  vehicle_status_change: { 
    icon: Car, 
    color: 'text-purple-500', 
    bg: 'bg-purple-50', 
    label: 'Statut véhicule' 
  },
  maintenance_reminder: { 
    icon: Wrench, 
    color: 'text-orange-500', 
    bg: 'bg-orange-50', 
    label: 'Rappel maintenance' 
  },
  sync_error: { 
    icon: AlertTriangle, 
    color: 'text-red-500', 
    bg: 'bg-red-50', 
    label: 'Erreur de synchro' 
  },
  alert_created: { 
    icon: AlertTriangle, 
    color: 'text-amber-500', 
    bg: 'bg-amber-50', 
    label: 'Nouvelle alerte' 
  }
};

function NotificationsContent() {
  const [filterType, setFilterType] = useState('all');
  const [filterRead, setFilterRead] = useState('all');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.entities.Notification.list('-created_date', 100)
  });

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

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => apiClient.entities.Notification.delete(id),
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
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const typeMatch = filterType === 'all' || n.type === filterType;
    const readMatch = filterRead === 'all' || 
      (filterRead === 'unread' && !n.read) || 
      (filterRead === 'read' && n.read);
    return typeMatch && readMatch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
            <p className="text-slate-500 mt-1">
              {unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes les notifications sont lues'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button 
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <Check className="w-4 h-4 mr-2" />
              Tout marquer comme lu
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="new_booking">Nouvelles réservations</SelectItem>
                <SelectItem value="booking_cancelled">Annulations</SelectItem>
                <SelectItem value="booking_modified">Modifications</SelectItem>
                <SelectItem value="vehicle_status_change">Statuts véhicules</SelectItem>
                <SelectItem value="maintenance_reminder">Maintenance</SelectItem>
                <SelectItem value="sync_error">Erreurs</SelectItem>
                <SelectItem value="alert_created">Alertes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={filterRead} onValueChange={setFilterRead}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="unread">Non lues</SelectItem>
              <SelectItem value="read">Lues</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Chargement...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucune notification</h3>
            <p className="text-sm text-slate-500">
              {filterType !== 'all' || filterRead !== 'all' 
                ? 'Essayez de modifier vos filtres' 
                : 'Vous n\'avez pas encore de notifications'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const config = notificationConfig[notification.type] || notificationConfig.alert_created;
              const Icon = config.icon;
              
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "bg-white rounded-xl border transition-all",
                    !notification.read ? "border-blue-200 shadow-sm" : "border-slate-200",
                    notification.action_url && "cursor-pointer hover:shadow-md"
                  )}
                  onClick={() => notification.action_url && handleNotificationClick(notification)}
                >
                  <div className="p-5">
                    <div className="flex gap-4">
                      <div className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0",
                        config.bg
                      )}>
                        <Icon className={cn("w-6 h-6", config.color)} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={cn(
                              "text-base font-semibold",
                              !notification.read ? "text-slate-900" : "text-slate-700"
                            )}>
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {config.label}
                          </Badge>
                        </div>
                        
                        <p className={cn(
                          "text-sm mb-3",
                          !notification.read ? "text-slate-700" : "text-slate-500"
                        )}>
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-400">
                            {format(parseISO(notification.created_date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                          </p>
                          
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsReadMutation.mutate(notification.id);
                                }}
                                className="text-xs"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Marquer lu
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotificationMutation.mutate(notification.id);
                              }}
                              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
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

export default function Notifications() {
  const { language } = useLanguage();
  return (
    <ProtectedPageWrapper language={language}>
      <NotificationsContent />
    </ProtectedPageWrapper>
  );
}