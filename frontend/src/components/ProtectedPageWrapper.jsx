import { useEffect, useState } from 'react';
import apiClient from '@/api/client';
import { createPageUrl } from '@/utils';
import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProtectedPageWrapper({ children, language = 'en' }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const isAuth = await apiClient.auth.isAuthenticated();
        if (!isAuth) {
          setIsAuthorized(false);
          return;
        }

        const user = await apiClient.auth.me();
        console.log('User email:', user?.email, 'Role:', user?.role);

        // Admins bypass subscription check
        if (user?.role === 'admin') {
          setIsAuthorized(true);
          return;
        }

        // Check for active subscription
        const subscriptions = await apiClient.entities.Subscription.filter(
          { created_by: user.email },
          '-created_date',
          1
        );

        console.log('Subscriptions found:', subscriptions);

        if (subscriptions?.length > 0 && (subscriptions[0].status === 'active' || subscriptions[0].status === 'trialing')) {
          setIsAuthorized(true);
          return;
        }

        setIsAuthorized(false);
      } catch (error) {
        console.error('Access check error:', error);
        setIsAuthorized(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAccess();
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">{language === 'fr' ? 'Vérification...' : 'Checking...'}</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Accès réservé aux abonnés</h1>
          <p className="text-slate-600 mb-8">
            Cette page est disponible uniquement pour les utilisateurs ayant un abonnement actif. Consultez nos plans d'abonnement pour accéder à toutes les fonctionnalités.
          </p>
          <Button
            onClick={() => window.location.href = createPageUrl('Landing') + '#pricing-section'}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            Voir les plans d'abonnement
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return children;
}