import { DollarSign, TrendingUp } from 'lucide-react';
import IntegrationCard from './IntegrationCard';
import { useLanguage } from '@/components/LanguageProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState } from 'react';
import { toast } from 'sonner';
import apiClient from '@/api/client';
import PayPalIntegration from './PayPalIntegration';

export default function RevenueIntegrations() {
  const { t, language } = useLanguage();
  const [showPayPal, setShowPayPal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnectStripe = async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.functions.invoke('stripePortal', { action: 'portal' });
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error(language === 'fr' ? 'Erreur lors de l\'ouverture de Stripe' : 'Error opening Stripe');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectPayPal = () => {
    setShowPayPal(true);
  };

  if (showPayPal) {
    return (
      <div>
        <button 
          onClick={() => setShowPayPal(false)}
          className="text-sm text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-1"
        >
          ← {language === 'fr' ? 'Retour' : 'Back'}
        </button>
        <PayPalIntegration />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{language === 'fr' ? 'Intégrations de Revenus' : 'Revenue Integrations'}</CardTitle>
              <CardDescription>{language === 'fr' 
                ? 'Connectez vos plateformes de paiement pour suivre vos revenus automatiquement'
                : 'Connect your payment platforms to track your revenue automatically'
              }</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            {language === 'fr'
              ? 'Synchronisez vos données de revenus à partir de vos plateformes de paiement pour obtenir une vue complète de votre performance financière.'
              : 'Sync your revenue data from your payment platforms to get a complete view of your financial performance.'
            }
          </p>
        </CardContent>
      </Card>

      {/* Payment Integrations */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          {language === 'fr' ? 'Plateformes de Paiement' : 'Payment Platforms'}
        </h3>

        <IntegrationCard
          title="Stripe"
          description={language === 'fr' 
            ? 'Synchronisez vos revenus Stripe et analysez vos performances de paiement'
            : 'Sync your Stripe revenue and analyze your payment performance'
          }
          icon={DollarSign}
          connected={false}
          onConnect={handleConnectStripe}
          isLoading={isLoading}
        />

        <IntegrationCard
          title="PayPal"
          description={language === 'fr'
            ? 'Connectez PayPal pour suivre vos transactions et revenus'
            : 'Connect PayPal to track your transactions and revenue'
          }
          icon={DollarSign}
          connected={false}
          onConnect={handleConnectPayPal}
          isLoading={isLoading}
        />
      </div>

      {/* Features Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-blue-900 mb-3">Fonctionnalités incluses</h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Synchronisation automatique des transactions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Rapports de revenus par véhicule et plateforme</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Analyse des commissions et frais</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Historique détaillé des paiements</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}