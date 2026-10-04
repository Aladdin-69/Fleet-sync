import { Check, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { toast } from 'sonner';
import apiClient from '@/api/client';

export default function PricingPlans() {
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      name: 'Starter',
      price: '19.99',
      priceId: 'price_1Sx8RI8Ee6MCd5y0D8JX00qX',
      description: 'Jusqu\'à 2 véhicules',
      vehicles: 'Jusqu\'à 2 véhicules',
      features: [
        'Synchronisation multi-plateformes',
        'Traitement des emails',
        'Intégration calendrier',
        'Alertes en temps réel',
        'Support par email'
      ],
      highlighted: false
    },
    {
      name: 'Growth',
      price: '39.99',
      priceId: 'price_1Sx8RI8Ee6MCd5y07dNgUwrv',
      description: 'Pour les flottes moyennes',
      vehicles: '3-7 véhicules',
      features: [
        'Synchronisation multi-plateformes',
        'Automatisation RPA',
        'Gestion avancée des alertes',
        'Rapports analytiques',
        'Support prioritaire',
        'API access'
      ],
      highlighted: true
    },
    {
      name: 'Entreprise',
      price: '79.99',
      priceId: 'price_1Sx8RI8Ee6MCd5y0d6Cq9ekV',
      description: 'Pour les grandes flottes',
      vehicles: '8+ véhicules',
      features: [
        'Synchronisation multi-plateformes',
        'Automatisation RPA',
        'Gestion avancée des alertes',
        'Rapports analytiques',
        'Gestion des revenus',
        'Intégrations PayPal & Stripe',
        'Gestion des utilisateurs multiples',
        'Support 24/7 par téléphone'
      ],
      highlighted: false
    }
  ];

  const handleCheckout = async (priceId) => {
    setLoading(true);
    try {
      const { data } = await apiClient.functions.invoke('createStripeCheckout', {
        priceId: priceId
      });
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error('Erreur lors de la création du lien de paiement');
      }
    } catch (error) {
      toast.error('Erreur lors de la création du lien de paiement');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 border-green-200">
            🎁 3 premiers jours offerts
          </Badge>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Choisissez votre plan
          </h1>
          <p className="text-xl text-slate-600">
            Tarifs simples et transparents. Essayez gratuitement pendant 3 jours.
          </p>
        </div>



        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-6 mb-12">
          {plans.map((plan) => (
            <div key={plan.name} className={`relative transition-all ${plan.highlighted ? 'md:scale-105' : ''}`}>
              {plan.highlighted && (
                <Badge className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600">
                  Le plus populaire
                </Badge>
              )}
              
              <Card className={`h-full flex flex-col ${plan.highlighted ? 'border-blue-200 shadow-lg' : ''}`}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                   <div className="flex items-baseline gap-1">
                     <span className="text-4xl font-bold text-slate-900">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(plan.price)}</span>
                     <span className="text-slate-600">/mois</span>
                   </div>
                   <p className="text-sm text-slate-600 mt-2">
                     {plan.vehicles}
                   </p>
                   <p className="text-xs text-green-600 font-medium mt-2">
                     ✓ 3 jours gratuits
                   </p>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  {/* Features List */}
                  <div className="space-y-3 mb-6 flex-1">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleCheckout(plan.priceId)}
                    disabled={loading}
                    variant={plan.highlighted ? 'default' : 'outline'}
                    className={`w-full font-semibold ${
                      plan.highlighted
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {loading ? 'Chargement...' : 'Commencer'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto bg-white rounded-xl p-8 border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Questions fréquentes</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Puis-je changer de plan ?
              </h3>
              <p className="text-slate-600">
                Oui, vous pouvez mettre à niveau ou rétrograder votre plan à tout moment. Les changements prendront effet au prochain cycle de facturation.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Y a-t-il un essai gratuit ?
              </h3>
              <p className="text-slate-600">
                Profitez de 3 jours gratuits pour tester le service. Ensuite, l'abonnement démarre automatiquement et le montant correspondant est prélevé.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Que se passe-t-il si j'ajoute plus de véhicules ?
              </h3>
              <p className="text-slate-600">
                Vous recevrez une notification pour mettre à niveau votre plan. Les tarifs incluent les véhicules supplémentaires.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Puis-je annuler mon abonnement ?
              </h3>
              <p className="text-slate-600">
                Oui, vous pouvez annuler votre abonnement à tout moment sans engagement. Aucun frais supplémentaire.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}