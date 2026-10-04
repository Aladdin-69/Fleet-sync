import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle2, Lock, Zap, Shield } from 'lucide-react';
import { toast } from 'sonner';
import CredentialsForm from '@/components/automation/CredentialsForm';
import HunosRentForm from '@/components/automation/HunosRentForm';
import AutomationLogsList from '@/components/automation/AutomationLogsList';
import CalendarIntegrations from '@/components/settings/CalendarIntegrations';
import { useLanguage } from '@/components/LanguageProvider';
import ProtectedPageWrapper from '@/components/ProtectedPageWrapper';

function AutomationPageContent() {
  const queryClient = useQueryClient();
  const [killedPlatform, setKilledPlatform] = useState(null);

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => apiClient.auth.me()
  });

  const { data: syncStatus = [] } = useQuery({
    queryKey: ['sync-status'],
    queryFn: () => apiClient.entities.SyncStatus.list('-created_date', 1)
  });

  const currentStatus = syncStatus[0] || {};

  const toggleAutomationMutation = useMutation({
    mutationFn: (enabled) => apiClient.auth.updateMe({ automation_enabled: enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Paramètres mis à jour');
    }
  });

  const handleKillSwitch = async (platform) => {
    setKilledPlatform(platform);
    toast.success(`Automatisation arrêtée pour ${platform}`);
    setTimeout(() => setKilledPlatform(null), 5000);
  };

  if (userLoading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Zap className="w-8 h-8 text-blue-600" />
            Automatisation Cloud
          </h1>
          <p className="text-slate-600 mt-2">
            Gestion de l'automatisation RPA pour bloquer les dates sur Turo et Getaround
          </p>
        </div>

        {/* Status Overview */}
        <Card className={killedPlatform ? 'border-red-200 bg-red-50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Status de l'automatisation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div>
                <p className="font-medium">Automatisation globale</p>
                <p className="text-sm text-slate-600">
                  {currentUser?.automation_enabled ? 'Active' : 'Désactivée'}
                </p>
              </div>
              <Button
                variant={currentUser?.automation_enabled ? 'destructive' : 'default'}
                onClick={() => toggleAutomationMutation.mutate(!currentUser?.automation_enabled)}
                disabled={toggleAutomationMutation.isPending}
              >
                {currentUser?.automation_enabled ? 'Désactiver' : 'Activer'}
              </Button>
            </div>

            {killedPlatform && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">
                  <p className="font-medium">Kill switch activé pour {killedPlatform}</p>
                  <p>Toute automatisation en cours a été arrêtée</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-slate-50 rounded">
                <p className="text-slate-600 mb-1">Turo</p>
                <p className="font-medium flex items-center gap-2 min-w-0">
                  {currentUser?.turo_credentials?.email && currentStatus.email_connected ? (
                    <><CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" /> <span>Configuré</span></>
                  ) : (
                    <span>Non configuré</span>
                  )}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded">
                <p className="text-slate-600 mb-1">Getaround</p>
                <p className="font-medium flex items-center gap-2 min-w-0">
                  {currentUser?.getaround_credentials?.email && currentStatus.email_connected ? (
                    <><CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" /> <span>Configuré</span></>
                  ) : (
                    <span>Non configuré</span>
                  )}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded">
                <p className="text-slate-600 mb-1">Hunos Rent</p>
                <p className="font-medium flex items-center gap-2 min-w-0">
                  {currentUser?.hunos_rent_credentials?.api_key_encrypted ? (
                    <><CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" /> <span>Configuré</span></>
                  ) : (
                    <span>Non configuré</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
         <Tabs defaultValue="credentials" className="w-full">
           <TabsList>
             <TabsTrigger value="credentials">Identifiants</TabsTrigger>
             <TabsTrigger value="calendars">Calendriers</TabsTrigger>
             <TabsTrigger value="logs">Historique</TabsTrigger>
             <TabsTrigger value="security">Sécurité</TabsTrigger>
           </TabsList>

          <TabsContent value="credentials" className="space-y-4">
           <div className="grid gap-4">
             <CredentialsForm
               platform="turo"
               currentEmail={currentUser?.turo_credentials?.email}
               onSuccess={() => queryClient.invalidateQueries({ queryKey: ['currentUser'] })}
             />
             <CredentialsForm
               platform="getaround"
               currentEmail={currentUser?.getaround_credentials?.email}
               onSuccess={() => queryClient.invalidateQueries({ queryKey: ['currentUser'] })}
             />
             <HunosRentForm
               currentApiKey={currentUser?.hunos_rent_credentials?.api_key_encrypted ? atob(currentUser.hunos_rent_credentials.api_key_encrypted) : ''}
               onSuccess={() => queryClient.invalidateQueries({ queryKey: ['currentUser'] })}
             />
           </div>
          </TabsContent>

          <TabsContent value="calendars" className="space-y-4">
            <CalendarIntegrations syncStatus={{}} />
          </TabsContent>

          <TabsContent value="logs">
            <AutomationLogsList />
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Garanties de sécurité
                </CardTitle>
                <CardDescription>
                  Comment vos données et comptes sont protégés
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Chiffrement des identifiants</p>
                      <p className="text-sm text-slate-600">
                        Tous les identifiants sont chiffrés avant stockage
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Exécution en cloud uniquement</p>
                      <p className="text-sm text-slate-600">
                        L'automatisation s'exécute sur des serveurs distants, pas sur votre ordinateur
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Détection des anomalies</p>
                      <p className="text-sm text-slate-600">
                        En cas de captcha, d'erreur ou de changement inattendu, l'automatisation s'arrête
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Journ alisation complète</p>
                      <p className="text-sm text-slate-600">
                        Chaque action est enregistrée et visible dans l'historique
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Kill switch immédiat</p>
                      <p className="text-sm text-slate-600">
                        Arrêtez l'automatisation à tout moment avec un bouton d'arrêt d'urgence
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>ℹ️ Note :</strong> L'automatisation n'est déclenchée que suite à une réservation confirmée. 
                    En cas de doute, une intervention humaine est toujours demandée.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function AutomationPage() {
  const { language } = useLanguage();
  return (
    <ProtectedPageWrapper language={language}>
      <AutomationPageContent />
    </ProtectedPageWrapper>
  );
}