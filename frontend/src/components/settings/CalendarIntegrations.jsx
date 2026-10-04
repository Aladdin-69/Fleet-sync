import { Calendar, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import { useState } from 'react';
import { toast } from 'sonner';
import apiClient from '@/api/client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function CalendarIntegrations({ syncStatus }) {
  const { t, language } = useLanguage();
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingOutlook, setIsLoadingOutlook] = useState(false);
  const [isLoadingDisconnect, setIsLoadingDisconnect] = useState(false);
  const queryClient = useQueryClient();

  const handleConnectGoogle = async () => {
    setIsLoadingGoogle(true);
    try {
      const { data } = await apiClient.functions.invoke('connectCalendar', { provider: 'google' });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      toast.success(language === 'fr' ? 'Google Calendar connecté' : 'Google Calendar connected');
    } catch (error) {
      toast.error(language === 'fr' ? 'Erreur de connexion Google Calendar' : 'Google Calendar connection error');
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleConnectOutlook = async () => {
    setIsLoadingOutlook(true);
    try {
      const { data } = await apiClient.functions.invoke('connectCalendar', { provider: 'outlook' });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      toast.success(language === 'fr' ? 'Outlook Calendar connecté' : 'Outlook Calendar connected');
    } catch (error) {
      toast.error(language === 'fr' ? 'Erreur de connexion Outlook Calendar' : 'Outlook Calendar connection error');
    } finally {
      setIsLoadingOutlook(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoadingDisconnect(true);
    try {
      await apiClient.auth.updateMe({ calendar_provider: 'none' });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      toast.success(t('calendarIntegrations.disconnected'));
    } catch (error) {
      toast.error(language === 'fr' ? 'Erreur de déconnexion' : 'Disconnection error');
    } finally {
      setIsLoadingDisconnect(false);
    }
  };

  const isGoogleConnected = syncStatus?.calendar_provider === 'google';
  const isOutlookConnected = syncStatus?.calendar_provider === 'outlook';

  const CalendarCard = ({ title, description, provider, isConnected, onConnect, isLoading }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'} className={cn(
            !isConnected && 'bg-slate-100 text-slate-700'
          )}>
            {isConnected ? (
              <CheckCircle2 className="w-3 h-3 mr-1" />
            ) : null}
            {isConnected ? t('integrationCard.connected') : t('integrationCard.notConnected')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {isConnected ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDisconnect}
              disabled={isLoadingDisconnect}
            >
              {isLoadingDisconnect && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              <Trash2 className="w-4 h-4 mr-1" />
              {t('integrationCard.disconnect')}
            </Button>
          ) : (
            <Button
              onClick={onConnect}
              disabled={isLoading}
              className="bg-black hover:bg-slate-900 text-white w-full"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('integrationCard.connect')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <CalendarCard
        title={t('calendarIntegrations.googleCalendar')}
        description={t('calendarIntegrations.googleCalendarDesc')}
        provider="google"
        isConnected={isGoogleConnected}
        onConnect={handleConnectGoogle}
        isLoading={isLoadingGoogle}
      />

      <CalendarCard
        title={t('calendarIntegrations.outlookCalendar')}
        description={t('calendarIntegrations.outlookCalendarDesc')}
        provider="outlook"
        isConnected={isOutlookConnected}
        onConnect={handleConnectOutlook}
        isLoading={isLoadingOutlook}
      />
    </div>
  );
}