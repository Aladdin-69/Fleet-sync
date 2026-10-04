import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

export default function IntegrationCard({ 
  title, 
  description, 
  icon: Icon, 
  connected, 
  connectedInfo,
  onConnect, 
  onDisconnect,
  isLoading,
  disabled 
}) {
  const { t } = useLanguage();
  
  return (
    <Card className="bg-white border-slate-200 hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription className="text-sm mt-1">{description}</CardDescription>
            </div>
          </div>
          {connected ? (
            <Badge className="bg-green-100 text-green-700 border-green-200">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {t('integrationCard.connected')}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-slate-500 border-slate-300">
              <XCircle className="w-3 h-3 mr-1" />
              {t('integrationCard.notConnected')}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {connected && connectedInfo && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">{connectedInfo}</p>
          </div>
        )}
        <div className="flex gap-2">
          {connected ? (
            <Button 
              variant="outline" 
              onClick={onDisconnect}
              disabled={isLoading || disabled}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('integrationCard.disconnecting')}
                </>
              ) : (
                t('integrationCard.disconnect')
              )}
            </Button>
          ) : (
            <Button 
              onClick={onConnect}
              disabled={isLoading || disabled}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('integrationCard.connecting')}
                </>
              ) : (
                t('integrationCard.connect')
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}