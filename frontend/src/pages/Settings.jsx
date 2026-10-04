import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Mail, CheckCircle2, Languages, DollarSign, Bell, CreditCard, Shield, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NotificationPreferences from '@/components/settings/NotificationPreferences';
import SubscriptionPlan from '@/components/settings/SubscriptionPlan';
import RGPDConsent from '@/components/settings/RGPDConsent';
import RevenueIntegrations from '@/components/settings/RevenueIntegrations';
import ProtectedPageWrapper from '@/components/ProtectedPageWrapper';

function SettingsContent() {
  const { t, language, setLanguage } = useLanguage();
  
  const { data: syncStatus = [] } = useQuery({
    queryKey: ['sync-status'],
    queryFn: () => apiClient.entities.SyncStatus.list('-created_date', 1)
  });

  const currentStatus = syncStatus[0] || {};

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{t('settings.title')}</h1>
          <p className="text-slate-500 mt-1">{t('settings.subtitle')}</p>
        </div>

        {/* Connection Status Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className={cn(
            "flex items-center gap-4 p-4 rounded-2xl border",
            currentStatus.email_connected 
              ? "bg-emerald-50 border-emerald-200" 
              : "bg-amber-50 border-amber-200"
          )}>
            <div className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl",
              currentStatus.email_connected ? "bg-emerald-100" : "bg-amber-100"
            )}>
              <Mail className={cn(
                "w-6 h-6",
                currentStatus.email_connected ? "text-emerald-600" : "text-amber-600"
              )} />
            </div>
            <div>
              <p className={cn(
                "font-medium",
                currentStatus.email_connected ? "text-emerald-800" : "text-amber-800"
              )}>
                {currentStatus.email_connected ? t('settings.emailConnected') : t('settings.emailNotConnected')}
              </p>
              <p className="text-sm text-slate-600">
                {currentStatus.email_provider 
                  ? `${t('settings.connectedVia')} ${currentStatus.email_provider}` 
                  : t('settings.connectToStart')}
              </p>
            </div>
          </div>

          <div className={cn(
            "flex items-center gap-4 p-4 rounded-2xl border",
            currentStatus.calendar_connected 
              ? "bg-emerald-50 border-emerald-200" 
              : "bg-slate-50 border-slate-200"
          )}>
            <div className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl",
              currentStatus.calendar_connected ? "bg-emerald-100" : "bg-slate-100"
            )}>
              <Calendar className={cn(
                "w-6 h-6",
                currentStatus.calendar_connected ? "text-emerald-600" : "text-slate-400"
              )} />
            </div>
            <div>
              <p className={cn(
                "font-medium",
                currentStatus.calendar_connected ? "text-emerald-800" : "text-slate-700"
              )}>
                {currentStatus.calendar_connected ? t('settings.calendarConnected') : t('settings.calendarNotConnected')}
              </p>
              <p className="text-sm text-slate-600">
                {currentStatus.calendar_provider && currentStatus.calendar_provider !== 'none'
                  ? `${t('settings.syncingTo')} ${currentStatus.calendar_provider}` 
                  : t('settings.optionalSync')}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
         <Tabs defaultValue="general" className="space-y-6">
           <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 bg-white border border-slate-200">
             <TabsTrigger value="general" className="text-xs sm:text-sm">
               <Languages className="w-4 h-4 sm:mr-2" />
               <span className="hidden sm:inline">{t('settings.general')}</span>
             </TabsTrigger>
             <TabsTrigger value="notifications" className="text-xs sm:text-sm">
               <Bell className="w-4 h-4 sm:mr-2" />
               <span className="hidden sm:inline">{t('settings.notifications')}</span>
             </TabsTrigger>
             <TabsTrigger value="rgpd" className="text-xs sm:text-sm">
               <Shield className="w-4 h-4 sm:mr-2" />
               <span className="hidden sm:inline">RGPD</span>
             </TabsTrigger>
             <TabsTrigger value="subscription" className="text-xs sm:text-sm">
               <CreditCard className="w-4 h-4 sm:mr-2" />
               <span className="hidden sm:inline">{t('settings.subscription')}</span>
             </TabsTrigger>
             <TabsTrigger value="revenue" className="text-xs sm:text-sm">
               <DollarSign className="w-4 h-4 sm:mr-2" />
               <span className="hidden sm:inline">{t('settings.revenue')}</span>
             </TabsTrigger>
           </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            {/* Auto Vehicle Detection */}
            <Card>
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{t('settings.autoDetection')}</CardTitle>
                    <CardDescription>{t('settings.autoDetectionDesc')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    {t('settings.autoDetectionInfo')}
                  </p>
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-green-800">{t('settings.featureActive')}</p>
                        <p className="text-sm text-green-700 mt-1">
                          {t('settings.featureActiveDesc')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Language Selector */}
            <Card>
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100">
                    <Languages className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{t('settings.language')}</CardTitle>
                    <CardDescription>{t('settings.languageDesc')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setLanguage('fr')}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left",
                      language === 'fr' 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div className="text-2xl">🇫🇷</div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{t('settings.french')}</p>
                    </div>
                    {language === 'fr' && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left",
                      language === 'en' 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div className="text-2xl">🇬🇧</div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{t('settings.english')}</p>
                    </div>
                    {language === 'en' && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <NotificationPreferences />
          </TabsContent>

          {/* RGPD Tab */}
          <TabsContent value="rgpd" className="space-y-4">
            <RGPDConsent />
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription">
            <SubscriptionPlan />
          </TabsContent>

          {/* Revenue Integrations Tab */}
          <TabsContent value="revenue" className="space-y-4">
            <RevenueIntegrations />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function Settings() {
  const { language } = useLanguage();
  return (
    <ProtectedPageWrapper language={language}>
      <SettingsContent />
    </ProtectedPageWrapper>
  );
}