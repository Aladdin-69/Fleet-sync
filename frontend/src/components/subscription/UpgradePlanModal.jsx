import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Zap, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import apiClient from '@/api/client';
import { useState } from 'react';
import { toast } from 'sonner';

export default function UpgradePlanModal({ isOpen, onClose, currentVehicles, currentPlan, onUpgradeSuccess }) {
  const { language } = useLanguage();
  const [upgrading, setUpgrading] = useState(false);

  const plans = [
    {
      id: 'starter',
      name: language === 'fr' ? 'Starter' : 'Starter',
      maxVehicles: 2,
      basePrice: 19.99,
      pricePerVehicle: 0,
      description: language === 'fr' ? 'Parfait pour débuter' : 'Perfect to get started',
      color: 'blue',
      fixedPrice: true
    },
    {
      id: 'growth',
      name: language === 'fr' ? 'Growth' : 'Growth',
      maxVehicles: 7,
      basePrice: 39.99,
      pricePerVehicle: 0,
      description: language === 'fr' ? 'Pour les flottes en expansion' : 'For growing fleets',
      color: 'indigo',
      popular: true,
      fixedPrice: true
    },
    {
      id: 'enterprise',
      name: language === 'fr' ? 'Entreprise' : 'Enterprise',
      maxVehicles: Infinity,
      basePrice: 79.99,
      pricePerVehicle: 0,
      description: language === 'fr' ? 'Flotte illimitée' : 'Unlimited fleet',
      color: 'emerald',
      fixedPrice: true
    }
  ];

  const calculatePrice = (plan, vehicles) => {
    if (plan.fixedPrice) {
      return plan.basePrice;
    }
    return plan.basePrice + (vehicles * plan.pricePerVehicle);
  };

  const currentPlanData = plans.find(p => p.id === currentPlan) || plans[0];
  const availablePlans = plans.filter(plan => plan.maxVehicles > currentVehicles);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            {language === 'fr' ? 'Augmentez votre capacité' : 'Increase your capacity'}
          </DialogTitle>
          <DialogDescription>
            {language === 'fr' 
              ? `Vous avez atteint la limite de ${currentPlanData.maxVehicles} véhicules de votre plan actuel. Choisissez un plan supérieur pour continuer.`
              : `You've reached the limit of ${currentPlanData.maxVehicles} vehicles on your current plan. Choose a higher plan to continue.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 mt-6 pb-48">
          {availablePlans.map((plan) => {
            const estimatedPrice = calculatePrice(plan, currentVehicles + 1);
            
            return (
              <Card 
                key={plan.id}
                className={`relative overflow-hidden ${plan.popular ? 'border-2 border-blue-500' : 'border border-slate-200'}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    {language === 'fr' ? 'RECOMMANDÉ' : 'RECOMMENDED'}
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className={`w-5 h-5 text-${plan.color}-600`} />
                        <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                      </div>
                      <p className="text-sm text-slate-600">{plan.description}</p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-3xl font-bold text-slate-900">
                        {estimatedPrice}€
                      </div>
                      <p className="text-sm text-slate-500">
                        {language === 'fr' ? '/ mois' : '/ month'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>
                        {plan.maxVehicles === Infinity 
                          ? (language === 'fr' ? 'Véhicules illimités' : 'Unlimited vehicles')
                          : `${language === 'fr' ? 'Jusqu\'à' : 'Up to'} ${plan.maxVehicles} ${language === 'fr' ? 'véhicules' : 'vehicles'}`
                        }
                      </span>
                    </div>
                    {!plan.fixedPrice && (
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>{plan.pricePerVehicle}€ {language === 'fr' ? 'par véhicule' : 'per vehicle'}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>{language === 'fr' ? 'Synchro multi-plateformes' : 'Multi-platform sync'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>{language === 'fr' ? 'Support prioritaire' : 'Priority support'}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full text-white font-semibold"
                    style={{
                      backgroundColor: plan.color === 'blue' ? '#2563eb' : plan.color === 'indigo' ? '#4f46e5' : '#059669'
                    }}
                    disabled={upgrading}
                    onClick={async () => {
                       setUpgrading(true);
                       try {
                         const { data } = await apiClient.functions.invoke('stripePortal', { action: 'portal' });
                         if (data.url) {
                           window.location.href = data.url;
                         }
                       } catch (error) {
                         toast.error(language === 'fr' ? 'Erreur lors de l\'ouverture de Stripe' : 'Error opening Stripe');
                       } finally {
                         setUpgrading(false);
                       }
                    }}
                  >
                    {upgrading ? (language === 'fr' ? 'Mise à jour...' : 'Upgrading...') : (language === 'fr' ? `Passer au plan ${plan.name}` : `Upgrade to ${plan.name}`)}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <p className="text-sm text-slate-600 text-center">
            {language === 'fr' 
              ? '💳 Paiement sécurisé • Sans engagement • Annulation à tout moment'
              : '💳 Secure payment • No commitment • Cancel anytime'
            }
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}