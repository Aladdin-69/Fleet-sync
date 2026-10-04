import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Zap, Car, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { useLanguage } from '@/components/LanguageProvider';
import { toast } from 'sonner';
import { useState } from 'react';

export default function SubscriptionPlan() {
  const { t } = useLanguage();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => apiClient.entities.Vehicle.list(),
  });

  const activeVehicles = vehicles.filter(v => !v.archived);
  const vehicleCount = activeVehicles.length;

  const getCurrentPlan = () => {
    if (vehicleCount <= 2) return { name: 'Starter', fixedPrice: 19.99 };
    if (vehicleCount <= 7) return { name: 'Growth', fixedPrice: 39.99 };
    return { name: 'Entreprise', fixedPrice: 79.99 };
  };

  const currentPlan = getCurrentPlan();
  const totalCost = currentPlan.fixedPrice;

  const features = [
    t('subscription.syncMultiPlatform'),
    t('subscription.realTimeAlerts'),
    t('subscription.calendarIntegration'),
    t('subscription.emailProcessing'),
    t('subscription.unlimitedBookings'),
    t('subscription.support')
  ];

  const handleManagePayment = async () => {
    setIsLoadingPortal(true);
    try {
      const { data } = await apiClient.functions.invoke('stripePortal', { action: 'portal' });
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.info(t('subscription.stripePortalInfo'), { duration: 4000 });
      }
    } catch (error) {
      toast.error(t('subscription.portalError'));
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const { data } = await apiClient.functions.invoke('stripePortal', { action: 'cancel' });
      if (data?.success) {
        toast.success('Abonnement annulé avec succès');
      } else {
        toast.info(data?.message || 'Aucun abonnement actif trouvé');
      }
    } catch (error) {
      console.error('Cancel subscription error:', error);
      toast.error('Erreur lors de l\'annulation: ' + (error?.message || 'Contactez le support'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">{t('subscription.fleetSyncPlan')}</CardTitle>
                <CardDescription>{t('subscription.activeSubscription')}</CardDescription>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-700 border-green-200">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {t('subscription.active')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Price Breakdown */}
            <div className="bg-white rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">
                    {t('subscription.basePlan')} {currentPlan.name}
                  </span>
                </div>
                <span className="font-medium">{currentPlan.fixedPrice} €/{t('subscription.month')}</span>
              </div>
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{t('subscription.totalPerMonth')}</span>
                  <span className="text-2xl font-bold text-blue-600">{totalCost} €</span>
                </div>
              </div>
            </div>

            {/* Pricing Tiers */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">{t('subscription.pricingTiers')}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Starter (1-2 {t('subscription.vehicles')})</span>
                  <span className="font-medium">19.99 €/{t('subscription.month')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Growth (3-7 {t('subscription.vehicles')})</span>
                  <span className="font-medium text-green-600">39.99 €/{t('subscription.month')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Entreprise (8+ {t('subscription.vehicles')})</span>
                  <span className="font-medium text-green-600">79.99 €/{t('subscription.month')}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                💡 {t('subscription.autoDegressivePricing')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Included */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('subscription.includedFeatures')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-slate-700">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handleManagePayment}
              disabled={isLoadingPortal}
            >
              {isLoadingPortal && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('subscription.managePayment')}
            </Button>
            <Button variant="outline" className="flex-1 text-red-600 hover:text-red-700" onClick={handleCancelSubscription}>
              {t('subscription.cancelSubscription')}
            </Button>
          </div>
          <p className="text-xs text-slate-500 text-center mt-4">
            {t('subscription.noCommitment')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}