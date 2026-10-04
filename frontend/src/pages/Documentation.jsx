import { useLanguage } from '@/components/LanguageProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  LayoutDashboard, Car, Calendar, AlertTriangle, Mail, Settings, 
  BarChart3, Users as UsersIcon, Bell, Book, Zap, UserCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Documentation() {
  const { t, language } = useLanguage();

  const pages = [
    {
      name: language === 'fr' ? 'Tableau de bord' : 'Dashboard',
      icon: LayoutDashboard,
      slug: 'Home',
      fr: {
        description: 'Vue d\'ensemble de votre système de synchronisation',
        details: 'Affiche l\'état global de la synchronisation, les emails traités aujourd\'hui, les véhicules actifs, les alertes et l\'activité récente.'
      },
      en: {
        description: 'Overview of your synchronization system',
        details: 'Displays the overall sync status, emails processed today, active vehicles, alerts and recent activity.'
      }
    },
    {
      name: language === 'fr' ? 'Véhicules' : 'Vehicles',
      icon: Car,
      slug: 'Vehicles',
      fr: {
        description: 'Gérez votre flotte de véhicules',
        details: 'Ajoutez, éditez et archivez vos véhicules. Consultez les réservations actives, synchronisez avec les plateformes et gérez les calendriers.'
      },
      en: {
        description: 'Manage your fleet of vehicles',
        details: 'Add, edit and archive your vehicles. View active bookings, sync with platforms and manage calendars.'
      }
    },
    {
      name: language === 'fr' ? 'Calendrier' : 'Calendar',
      icon: Calendar,
      slug: 'Calendar',
      fr: {
        description: 'Vue calendrier de toutes les réservations',
        details: 'Affiche tous les événements de réservation de votre flotte dans un calendrier interactif. Filtrez par véhicule ou plateforme.'
      },
      en: {
        description: 'Calendar view of all bookings',
        details: 'Displays all booking events for your fleet in an interactive calendar. Filter by vehicle or platform.'
      }
    },
    {
      name: language === 'fr' ? 'Analytiques' : 'Analytics',
      icon: BarChart3,
      slug: 'Analytics',
      fr: {
        description: 'Analyse des performances et métriques',
        details: 'Consultez les revenus, l\'utilisation des véhicules, la distribution par plateforme et les performances par véhicule.'
      },
      en: {
        description: 'Performance analysis and metrics',
        details: 'View revenue, vehicle utilization, platform distribution and performance per vehicle.'
      }
    },
    {
      name: language === 'fr' ? 'Alertes' : 'Alerts',
      icon: AlertTriangle,
      slug: 'Alerts',
      fr: {
        description: 'Gestion des alertes et problèmes',
        details: 'Consultez toutes les alertes système, filtrez par sévérité et statut, et marquez-les comme résolues.'
      },
      en: {
        description: 'Alert and issue management',
        details: 'View all system alerts, filter by severity and status, and mark them as resolved.'
      }
    },
    {
      name: language === 'fr' ? 'Activité Email' : 'Email Activity',
      icon: Mail,
      slug: 'EmailActivity',
      fr: {
        description: 'Journal d\'audit des emails traités',
        details: 'Consultez tous les emails reçus, leur classification, les actions prises et les prévisualisations du contenu.'
      },
      en: {
        description: 'Audit log of processed emails',
        details: 'View all received emails, their classification, actions taken and content previews.'
      }
    },
    {
      name: language === 'fr' ? 'Clients' : 'Customers',
      icon: UserCircle,
      slug: 'Clients',
      fr: {
        description: 'Gestion des clients et historique',
        details: 'Créez et gérez les profils clients, consultez leurs réservations et préférences.'
      },
      en: {
        description: 'Customer management and history',
        details: 'Create and manage customer profiles, view their bookings and preferences.'
      }
    },
    {
      name: language === 'fr' ? 'Automatisation' : 'Automation',
      icon: Zap,
      slug: 'Automation',
      fr: {
        description: 'Gestion de l\'automatisation RPA',
        details: 'Configurez les identifiants des plateformes, activez/désactivez l\'automatisation et consultez les logs d\'exécution.'
      },
      en: {
        description: 'RPA Automation management',
        details: 'Configure platform credentials, enable/disable automation and view execution logs.'
      }
    },
    {
      name: language === 'fr' ? 'Notifications' : 'Notifications',
      icon: Bell,
      slug: 'NotificationCenter',
      fr: {
        description: 'Centre de notifications',
        details: 'Consultez toutes vos notifications, marquez-les comme lues et gérez vos préférences.'
      },
      en: {
        description: 'Notification center',
        details: 'View all your notifications, mark them as read and manage your preferences.'
      }
    },
    {
      name: language === 'fr' ? 'Paramètres' : 'Settings',
      icon: Settings,
      slug: 'Settings',
      fr: {
        description: 'Configuration et préférences',
        details: 'Gérez les connexions (email, calendrier), langue, notifications, conformité RGPD et abonnement.'
      },
      en: {
        description: 'Configuration and preferences',
        details: 'Manage connections (email, calendar), language, notifications, GDPR compliance and subscription.'
      }
    },
    {
      name: language === 'fr' ? 'Utilisateurs' : 'Users',
      icon: UsersIcon,
      slug: 'Users',
      admin: true,
      fr: {
        description: 'Gestion des utilisateurs (Admin)',
        details: 'Invitez des utilisateurs, gérez leurs rôles et permissions, et modifiez leur accès.'
      },
      en: {
        description: 'User management (Admin)',
        details: 'Invite users, manage their roles and permissions, and edit their access.'
      }
    }
  ];

  const content = language === 'fr' ? 'fr' : 'en';

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Book className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">
              {language === 'fr' ? 'Documentation' : 'Documentation'}
            </h1>
          </div>
          <p className="text-slate-600">
            {language === 'fr' 
              ? 'Guide complet de chaque page de FleetSync'
              : 'Complete guide of each FleetSync page'}
          </p>
        </div>

        {/* Pages Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => {
            const Icon = page.icon;
            const pageContent = page[content];
            
            return (
              <Card key={page.slug} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <CardTitle className="text-base">{page.name}</CardTitle>
                    </div>
                    {page.admin && (
                      <Badge className="ml-2 bg-amber-100 text-amber-800">
                        {language === 'fr' ? 'Admin' : 'Admin'}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{pageContent.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {pageContent.details}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Key Features Section */}
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {language === 'fr' ? 'Fonctionnalités principales' : 'Key Features'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-slate-700">
                  {language === 'fr' 
                    ? 'Synchronisation multi-plateformes (Turo, Getaround, Hunos Rent)'
                    : 'Multi-platform synchronization (Turo, Getaround, Hunos Rent)'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-slate-700">
                  {language === 'fr' 
                    ? 'Traitement automatique des emails de réservation'
                    : 'Automatic booking email processing'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-slate-700">
                  {language === 'fr' 
                    ? 'Intégration calendrier (Google, Outlook)'
                    : 'Calendar integration (Google, Outlook)'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-slate-700">
                  {language === 'fr' 
                    ? 'Automatisation RPA pour bloquer les dates'
                    : 'RPA automation to block dates'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {language === 'fr' ? 'Navigation rapide' : 'Quick Navigation'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">→</span>
                <span className="text-slate-700">
                  {language === 'fr' 
                    ? 'Cliquez sur un élément du menu pour naviguer vers une page'
                    : 'Click an item in the menu to navigate to a page'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">→</span>
                <span className="text-slate-700">
                  {language === 'fr' 
                    ? 'Utilisez le bouton de menu mobile sur téléphone'
                    : 'Use the mobile menu button on phone'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">→</span>
                <span className="text-slate-700">
                  {language === 'fr' 
                    ? 'Accédez à l\'aide depuis les paramètres'
                    : 'Access help from settings'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}