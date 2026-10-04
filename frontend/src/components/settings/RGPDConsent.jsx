import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle2, AlertCircle, Mail } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function RGPDConsent() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [emailConsent, setEmailConsent] = useState(false);
  const [dataRetentionConsent, setDataRetentionConsent] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => apiClient.auth.me(),
  });

  const { data: consents = [] } = useQuery({
    queryKey: ['user-consents'],
    queryFn: () => apiClient.entities.UserConsent.list('-created_date', 1),
    enabled: !!currentUser,
  });

  const currentConsent = consents[0];

  useEffect(() => {
    if (currentConsent) {
      setEmailConsent(currentConsent.email_processing_consent || false);
      setDataRetentionConsent(currentConsent.data_retention_consent || false);
    }
  }, [currentConsent]);

  const saveConsentMutation = useMutation({
    mutationFn: async (data) => {
      if (currentConsent) {
        return apiClient.entities.UserConsent.update(currentConsent.id, data);
      } else {
        return apiClient.entities.UserConsent.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-consents'] });
      toast.success(t('rgpd.consentSaved'));
    },
  });

  const handleSaveConsent = () => {
    saveConsentMutation.mutate({
      email_processing_consent: emailConsent,
      data_retention_consent: dataRetentionConsent,
      consent_date: new Date().toISOString(),
      allowed_email_domains: ['@turo.fr', '@getaround.com', '@hunosrent.com'],
    });
  };

  const allConsentsGiven = emailConsent && dataRetentionConsent;

  return (
    <div className="space-y-6">
      {/* RGPD Status Card */}
      <Card>
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${allConsentsGiven ? 'bg-green-100' : 'bg-amber-100'}`}>
              <Shield className={`w-5 h-5 ${allConsentsGiven ? 'text-green-600' : 'text-amber-600'}`} />
            </div>
            <div>
              <CardTitle className="text-lg">{t('rgpd.title')}</CardTitle>
              <CardDescription>{t('rgpd.subtitle')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Consent Status */}
          {currentConsent && (
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                {allConsentsGiven ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                )}
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {allConsentsGiven ? t('rgpd.consentGiven') : t('rgpd.consentPending')}
                  </p>
                  {currentConsent.consent_date && (
                    <p className="text-xs text-slate-500">
                      {t('rgpd.lastUpdate')}: {format(new Date(currentConsent.consent_date), 'dd/MM/yyyy HH:mm')}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant={allConsentsGiven ? 'default' : 'secondary'}>
                {allConsentsGiven ? t('rgpd.active') : t('rgpd.incomplete')}
              </Badge>
            </div>
          )}

          {/* Consent Options */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl">
              <Checkbox
                id="email-consent"
                checked={emailConsent}
                onCheckedChange={setEmailConsent}
                disabled={!!currentConsent}
              />
              <div className="flex-1">
                <label htmlFor="email-consent" className={`text-sm font-medium cursor-pointer ${currentConsent ? 'text-slate-500' : 'text-slate-900'}`}>
                  {t('rgpd.emailProcessing')}
                </label>
                <p className="text-xs text-slate-500 mt-1">
                  {t('rgpd.emailProcessingDesc')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl">
              <Checkbox
                id="data-consent"
                checked={dataRetentionConsent}
                onCheckedChange={setDataRetentionConsent}
                disabled={!!currentConsent}
              />
              <div className="flex-1">
                <label htmlFor="data-consent" className={`text-sm font-medium cursor-pointer ${currentConsent ? 'text-slate-500' : 'text-slate-900'}`}>
                  {t('rgpd.dataRetention')}
                </label>
                <p className="text-xs text-slate-500 mt-1">
                  {t('rgpd.dataRetentionDesc')}
                </p>
              </div>
            </div>

            {currentConsent && (
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-600">
                  Pour modifier ces consentements, veuillez contacter <a href="mailto:contact@fleetsync.com" className="font-medium text-slate-900 hover:underline">contact@fleetsync.com</a>
                </p>
              </div>
            )}
          </div>

          {/* Allowed Domains Info */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-900 text-sm">{t('rgpd.allowedDomains')}</p>
                <p className="text-sm text-blue-700 mt-1">{t('rgpd.allowedDomainsDesc')}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['@turo.fr', '@getaround.com', '@hunosrent.com'].map(domain => (
                    <Badge key={domain} variant="outline" className="bg-white">
                      {domain}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
           <Button 
             onClick={handleSaveConsent} 
             className="w-full"
             disabled={saveConsentMutation.isPending || !!currentConsent}
           >
             {saveConsentMutation.isPending ? t('rgpd.saving') : t('rgpd.saveConsent')}
           </Button>

          {/* Data Rights Info */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('rgpd.dataRights')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}