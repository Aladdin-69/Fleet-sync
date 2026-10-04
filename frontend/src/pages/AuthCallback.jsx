import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/components/LanguageProvider';
import { toast } from 'sonner';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Extract token and user from URL parameters
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const userString = params.get('user');

        if (!token) {
          toast.error(t('authCallback.noToken'));
          navigate('/login');
          return;
        }

        let user = null;
        if (userString) {
          try {
            user = JSON.parse(decodeURIComponent(userString));
          } catch (parseError) {
            console.error('Error parsing user data:', parseError);
          }
        }

        // Use the auth context to handle login
        await login(token, user);

        // Navigate to home or previous page
        const returnUrl = localStorage.getItem('returnUrl');
        if (returnUrl) {
          localStorage.removeItem('returnUrl');
          navigate(returnUrl);
        } else {
          navigate('/');
        }

        toast.success(t('authCallback.loginSuccess'));
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error(t('authCallback.loginFailed'));
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [location, login, navigate, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {t('authCallback.processing')}
          </h2>
          <p className="text-slate-600">
            {t('authCallback.pleaseWait')}
          </p>
        </div>
      </div>
    </div>
  );
}