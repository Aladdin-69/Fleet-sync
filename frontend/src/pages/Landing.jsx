import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Calendar,
  Mail,
  Shield,
  BarChart3,
  Bell,
  Check,
  ArrowRight,
  Car,
  Clock,
  DollarSign
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import apiClient from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Landing() {
  const { t, language } = useLanguage();

  const { data: isAuthenticated } = useQuery({
    queryKey: ['isAuthenticated'],
    queryFn: () => apiClient.auth.isAuthenticated(),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => apiClient.auth.me(),
    enabled: !!isAuthenticated,
  });

  // Check if user has active or trial subscription
  const hasActiveSubscription = currentUser?.subscription_status === 'active' || currentUser?.subscription_status === 'trialing';

  const features = [
    {
      icon: Mail,
      title: language === 'fr' ? 'Lecture sécurisée' : 'Secure Reading',
      description: language === 'fr'
        ? 'Lecture seule des emails @turo.fr, @getaround.com. Synchronisation automatique avec Google Calendar et Outlook Calendar pour une vue centralisée.'
        : 'Read-only access to @turo.fr, @getaround.com emails. Automatic sync with Google Calendar and Outlook Calendar for a centralized view.'
    },
    {
      icon: Zap,
      title: language === 'fr' ? 'Détection automatique' : 'Automatic Detection',
      description: language === 'fr'
        ? 'L\'IA analyse chaque email et détecte : réservations, annulations, modifications'
        : 'AI analyzes each email and detects: bookings, cancellations, modifications'
    },
    {
      icon: Car,
      title: language === 'fr' ? 'Source de vérité unique' : 'Single Source of Truth',
      description: language === 'fr'
        ? 'État réel de chaque véhicule centralisé. Évite les doubles réservations.'
        : 'Real status of each vehicle centralized. Prevents double-bookings.'
    },
    {
      icon: Bell,
      title: language === 'fr' ? 'Alertes intelligentes' : 'Smart Alerts',
      description: language === 'fr'
        ? 'En cas de doute, aucune action automatique. Alerte claire pour validation.'
        : 'When in doubt, no automatic action. Clear alert for validation.'
    },
    {
      icon: Calendar,
      title: language === 'fr' ? 'Calendrier synchronisé' : 'Synced Calendar',
      description: language === 'fr'
        ? 'Vue unifiée dans Google Calendar ou Outlook. Visibilité totale en temps réel.'
        : 'Unified view in Google Calendar or Outlook. Full real-time visibility.'
    },
    {
      icon: Shield,
      title: language === 'fr' ? 'Conforme RGPD' : 'GDPR Compliant',
      description: language === 'fr'
        ? 'Minimisation des données. Journal d\'audit. Suppression sur demande.'
        : 'Data minimization. Audit log. Deletion on request.'
    }
  ];

  const pricingTiers = [
    {
      name: 'Starter',
      vehicles: language === 'fr' ? 'Jusqu\'à 2 véhicules' : 'Up to 2 vehicles',
      price: '19.99€',
      unit: language === 'fr' ? '/mois' : '/month',
      priceId: 'price_1Sx8RI8Ee6MCd5y0D8JX00qX'
    },
    {
      name: 'Growth',
      vehicles: language === 'fr' ? '3-7 véhicules' : '3-7 vehicles',
      price: '39.99€',
      unit: language === 'fr' ? '/mois' : '/month',
      popular: true,
      priceId: 'price_1Sx8RI8Ee6MCd5y07dNgUwrv'
    },
    {
      name: 'Entreprise',
      vehicles: language === 'fr' ? '8+ véhicules' : '8+ vehicles',
      price: '79.99€',
      unit: language === 'fr' ? '/mois' : '/month',
      priceId: 'price_1Sx8RI8Ee6MCd5y0d6Cq9ekV'
    }
  ];

  const stats = [
    {
      icon: Clock,
      value: '5h',
      label: language === 'fr' ? 'économisées/semaine' : 'saved per week'
    },
    {
      icon: Mail,
      value: '100%',
      label: language === 'fr' ? 'emails traités' : 'emails processed'
    },
    {
      icon: DollarSign,
      value: '0',
      label: language === 'fr' ? 'double-réservation' : 'double-booking'
    }
  ];

  const [loadingPriceId, setLoadingPriceId] = useState(null);

  const handleGetStarted = () => {
    if (isAuthenticated && !hasActiveSubscription) {
      // User logged in but no subscription - redirect to pricing
      const pricingSection = document.getElementById('pricing-section');
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (isAuthenticated && hasActiveSubscription) {
      // User has subscription - go to dashboard
      window.location.href = createPageUrl('Vehicles');
    } else {
      // Not authenticated - scroll to pricing
      const pricingSection = document.getElementById('pricing-section');
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleSubscribe = async (priceId) => {
    setLoadingPriceId(priceId);
    try {
      const { data } = await apiClient.functions.invoke('createStripeCheckout', {
        priceId: priceId
      });

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoadingPriceId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">FleetSync</span>
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated && hasActiveSubscription ? (
                <Link to={createPageUrl('Vehicles')}>
                  <Button size="sm">
                    {language === 'fr' ? 'Tableau de bord' : 'Dashboard'}
                  </Button>
                </Link>
              ) : isAuthenticated && !hasActiveSubscription ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.href = createPageUrl('Home')}
                >
                  {language === 'fr' ? 'Mon compte' : 'My Account'}
                </Button>
              ) : !isAuthenticated ? (
                <Button size="sm" onClick={() => apiClient.auth.redirectToLogin(createPageUrl('Home'))}>
                  {language === 'fr' ? 'Se connecter' : 'Sign In'}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">
              {language === 'fr' ? '🎁 3 jours offerts' : '🎁 3 free days'}
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
              {language === 'fr' ? 'Fini les' : 'Stop'}<br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {language === 'fr' ? 'doubles réservations' : 'double-bookings'}
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              {language === 'fr'
                ? 'FleetSync lit vos emails de réservation (Turo, Getaround) et centralise l\'état réel de chaque véhicule sur chaque plateforme.'
                : 'FleetSync reads your booking emails (Turo, Getaround) and centralizes the real status of each vehicle on each platform.'
              }
            </p>
            <div className="flex items-center justify-center gap-2 mb-8">
              <Badge variant="outline" className="bg-white">
                <Shield className="w-3 h-3 mr-1" />
                {language === 'fr' ? 'Lecture seule des emails' : 'Read-only email access'}
              </Badge>
              <Badge variant="outline" className="bg-white">
                <Check className="w-3 h-3 mr-1" />
                {language === 'fr' ? 'Conforme RGPD' : 'GDPR Compliant'}
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleGetStarted} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                {language === 'fr' ? 'Essayer 3 jours gratuits' : 'Try 3 Days Free'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline">
                {language === 'fr' ? 'Voir la démo' : 'View Demo'}
              </Button>
            </div>
            <p className="text-sm text-slate-500 mt-4">
              {language === 'fr' ? '✓ 3 jours gratuits • Puis votre abonnement démarre' : '✓ 3 free days • Then your subscription starts'}
            </p>
            <p className="text-xs text-slate-400 mt-2">
              {language === 'fr' ? 'Sans engagement • Résiliable à tout moment' : 'No commitment • Cancel anytime'}
            </p>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {stats.map((stat, idx) => (
              <Card key={idx} className="border-slate-200">
                <CardContent className="pt-6 text-center">
                  <stat.icon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-sm text-slate-600 mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              {language === 'fr' ? 'Comment ça marche ?' : 'How it works?'}
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-8">
              {language === 'fr'
                ? 'FleetSync se connecte à vos comptes Turo et Getaround EN TOUTE SÉCURITÉ. Les mots de passe ne sont jamais stockés, seules les sessions (cookies) chiffrées en AES-256 sont conservées.'
                : 'FleetSync securely connects to your Turo and Getaround accounts. Passwords are never stored, only encrypted sessions (cookies) with AES-256 encryption are retained.'
              }
            </p>
            <Card className="max-w-4xl mx-auto border-blue-200 bg-blue-50/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 text-left">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">
                      {language === 'fr' ? '🔐 Phrase clé à retenir' : '🔐 Key phrase to remember'}
                    </h4>
                    <p className="text-slate-700 leading-relaxed">
                      {language === 'fr'
                        ? 'FleetSync se connecte SÉCURISÉMENT à vos comptes Turo et Getaround : les mots de passe ne sont jamais stockés, seules les sessions (cookies) chiffrées en AES-256 sont sauvegardées. Chaque client dispose de workers isolés pour garantir aucun partage de données.'
                        : 'FleetSync securely connects to your Turo and Getaround accounts: passwords are never stored, only AES-256 encrypted sessions (cookies) are saved. Each client has isolated workers to ensure no data sharing.'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            {[
              {
                step: '1',
                icon: Mail,
                title: language === 'fr' ? 'Email' : 'Email',
                description: language === 'fr' ? 'Accès lecture seule aux emails Turo, Getaround' : 'Read-only access to Turo, Getaround emails'
              },
              {
                step: '2',
                icon: Shield,
                title: language === 'fr' ? 'Sessions sécurisées' : 'Secure Sessions',
                description: language === 'fr' ? 'Connexion aux comptes (cookies stockés, jamais les mots de passe)' : 'Connect accounts (cookies stored, never passwords)'
              },
              {
                step: '3',
                icon: Zap,
                title: language === 'fr' ? 'Analyse IA' : 'AI Analysis',
                description: language === 'fr' ? 'Détection automatique des réservations et modifications' : 'Automatic booking detection and changes'
              },
              {
                step: '4',
                icon: Bell,
                title: language === 'fr' ? 'Alertes' : 'Alerts',
                description: language === 'fr' ? 'Notification immédiate en cas de risque de conflit' : 'Immediate notification of conflict risks'
              }
            ].map((item, idx) => (
              <Card key={idx} className="border-slate-200 text-center">
                <CardContent className="pt-6">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto mb-3">
                    {item.step}
                  </div>
                  <item.icon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-slate-900 mb-2">{item.title}</h4>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Security Details Card */}
          <Card className="max-w-4xl mx-auto border-green-200 bg-green-50/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">
                    {language === 'fr' ? '🔐 Sécurité : Connexion Turo & Getaround' : '🔐 Security: Turo & Getaround Connection'}
                  </h4>
                  <div className="space-y-2 text-sm text-slate-700">
                    <p>
                      <strong>{language === 'fr' ? '✓ Cookies uniquement' : '✓ Cookies only'}:</strong> {language === 'fr'
                        ? 'Vos mots de passe ne sont JAMAIS stockés sur nos serveurs. Nous ne stockons que les sessions actives (cookies).'
                        : 'Your passwords are NEVER stored on our servers. We only store active sessions (cookies).'
                      }
                    </p>
                    <p>
                      <strong>{language === 'fr' ? '✓ Chiffrement AES-256' : '✓ AES-256 Encryption'}:</strong> {language === 'fr'
                        ? 'Les cookies sont chiffrés avant stockage en base de données.'
                        : 'Cookies are encrypted before database storage.'
                      }
                    </p>
                    <p>
                      <strong>{language === 'fr' ? '✓ Journal d\'audit complet' : '✓ Complete Audit Log'}:</strong> {language === 'fr'
                        ? 'Chaque action est enregistrée et peut être consultée à tout moment.'
                        : 'Every action is logged and can be reviewed anytime.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              {language === 'fr' ? 'Sécurité & fonctionnalités' : 'Security & features'}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {language === 'fr'
                ? 'Conçu selon le principe de minimisation des données (RGPD)'
                : 'Designed with data minimization principle (GDPR)'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="border-slate-200 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-red-50">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {language === 'fr' ? '💥 Une réservation annulée ou non honorée = jusqu\'à 50€ perdus' : '💥 A cancelled or no-show booking = up to €50 lost'}
                  </h3>
                  <p className="text-slate-700">
                    {language === 'fr'
                      ? 'Sans visibilité centralisée, le risque de double-réservations et de pertes financières augmente considérablement. FleetSync vous protège en centralisant l\'état réel de chaque véhicule.'
                      : 'Without centralized visibility, the risk of double-bookings and financial losses increases significantly. FleetSync protects you by centralizing the real status of each vehicle.'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing-section" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-700 border-green-200">
              {language === 'fr' ? '🎁 3 premiers jours offerts' : '🎁 First 3 days free'}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              {language === 'fr' ? 'Choisissez votre plan' : 'Choose your plan'}
            </h2>
            <p className="text-lg text-slate-600">
              {language === 'fr'
                ? 'Tarifs simples et transparents. Essayez gratuitement pendant 3 jours.'
                : 'Simple and transparent pricing. Try free for 3 days.'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {pricingTiers.map((tier, idx) => (
              <Card
                key={idx}
                className={tier.popular
                  ? "border-blue-500 shadow-lg scale-105 relative"
                  : "border-slate-200"
                }
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600">
                    {language === 'fr' ? 'Populaire' : 'Popular'}
                  </Badge>
                )}
                <CardContent className="pt-6 text-center">
                  <p className="text-lg font-bold text-slate-900 mb-1">{tier.name}</p>
                  <p className="text-sm font-medium text-slate-600 mb-4">{tier.vehicles}</p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-slate-900">{tier.price}</span>
                    <span className="text-slate-600">{tier.unit}</span>
                  </div>
                  <p className="text-xs text-green-600 font-medium mb-4">
                    {language === 'fr' ? '✓ 3 jours gratuits' : '✓ 3 days free'}
                  </p>
                  <Button
                    onClick={() => handleSubscribe(tier.priceId)}
                    disabled={loadingPriceId === tier.priceId}
                    className={tier.popular ? 'w-full bg-blue-600 hover:bg-blue-700' : 'w-full border-slate-300 text-slate-900 hover:bg-slate-50'}
                    variant={tier.popular ? 'default' : 'outline'}
                  >
                    {loadingPriceId === tier.priceId
                      ? (language === 'fr' ? 'Chargement...' : 'Loading...')
                      : (language === 'fr' ? 'S\'abonner' : 'Subscribe')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center mb-12">
            <p className="text-sm text-slate-600">
              {language === 'fr' ? '💳 Sans engagement • Résiliable à tout moment • Accès immédiat' : '💳 No commitment • Cancel anytime • Instant access'}
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="border-slate-200">
              <CardContent className="pt-6">
                <h4 className="font-semibold text-slate-900 mb-4">
                  {language === 'fr' ? 'Toutes les fonctionnalités incluses :' : 'All features included:'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    language === 'fr' ? 'Lecture seule des emails @turo.fr, @getaround.com' : 'Read-only access to @turo.fr, @getaround.com and emails',
                    language === 'fr' ? 'Connexion sécurisée aux comptes Turo & Getaround (cookies, jamais les mots de passe)' : 'Secure connection to Turo & Getaround accounts (cookies, never passwords)',
                    language === 'fr' ? 'Chiffrement AES-256 des sessions stockées' : 'AES-256 encryption of stored sessions',
                    language === 'fr' ? 'Analyse IA des réservations et modifications' : 'AI analysis of bookings and changes',
                    language === 'fr' ? 'Source de vérité unique centralisée' : 'Centralized single source of truth',
                    language === 'fr' ? 'Alertes intelligentes en cas de conflit' : 'Smart alerts for conflicts',
                    language === 'fr' ? 'Journal d\'audit complet de chaque action' : 'Complete audit log of all actions',
                    language === 'fr' ? 'Suppression des données sur demande - Conforme RGPD' : 'Data deletion on request - GDPR compliant'
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            {language === 'fr'
              ? 'Prêt à simplifier la gestion de votre flotte ?'
              : 'Ready to simplify your fleet management?'
            }
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {language === 'fr'
              ? 'Rejoignez les loueurs qui ont automatisé leur gestion avec FleetSync'
              : 'Join the hosts who automated their management with FleetSync'
            }
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-white text-blue-600 hover:bg-slate-50 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-10 rounded-md px-8"
          >
            {language === 'fr' ? 'Essayer 3 jours gratuits' : 'Try 3 Days Free'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
          <p className="text-blue-100 mt-4 text-sm">
            {language === 'fr' ? '3 jours offerts • Puis votre abonnement démarre automatiquement' : '3 free days • Then your subscription starts automatically'}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-slate-900">FleetSync</span>
              </div>
              <p className="text-sm text-slate-600">
                {language === 'fr' ? 'Gestion simplifiée de votre flotte de location' : 'Simplified fleet rental management'}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">
                {language === 'fr' ? 'Liens rapides' : 'Quick Links'}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to={createPageUrl('Pricing')} className="text-slate-600 hover:text-slate-900 transition">
                    {language === 'fr' ? 'Tarification' : 'Pricing'}
                  </Link>
                </li>
                <li>
                  <Link to={createPageUrl('LegalNotice')} className="text-slate-600 hover:text-slate-900 transition">
                    {language === 'fr' ? 'Mentions légales' : 'Legal Notice'}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">
                {language === 'fr' ? 'Légal' : 'Legal'}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to={createPageUrl('PrivacyPolicy')} className="text-slate-600 hover:text-slate-900 transition">
                    {language === 'fr' ? 'Politique de confidentialité' : 'Privacy Policy'}
                  </Link>
                </li>
                <li>
                  <Link to={createPageUrl('TermsOfService')} className="text-slate-600 hover:text-slate-900 transition">
                    {language === 'fr' ? 'Conditions d\'utilisation' : 'Terms of Service'}
                  </Link>
                </li>
                <li>
                  <Link to={createPageUrl('CookiePolicy')} className="text-slate-600 hover:text-slate-900 transition">
                    {language === 'fr' ? 'Politique cookies' : 'Cookie Policy'}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center text-sm text-slate-600">
            <p>© 2026 FleetSync. {language === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}</p>
            <p className="text-xs text-slate-500 mt-2">
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}