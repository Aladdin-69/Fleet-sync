import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  Car,
  Calendar,
  AlertTriangle,
  Mail,
  Settings,
  Menu,
  X,
  Zap,
  Users as UsersIcon,
  BarChart3,
  UserCircle,
  Bell,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { LanguageProvider, useLanguage } from '@/components/LanguageProvider';
import NotificationBell from '@/components/notifications/NotificationBell';
import CriticalAlertBanner from '@/components/notifications/CriticalAlertBanner';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';

function LayoutContent({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useLanguage();
  const location = useLocation();

  // Google Analytics
  useEffect(() => {
    // Initialize Google Analytics
    const gaId = 'YOUR_GOOGLE_ANALYTICS_ID'; // Replace with actual GA Measurement ID
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script1);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', gaId);
  }, []);

  // Determine if we're on the Landing page
  const isLandingPage = location.pathname === '/' || location.pathname === '/Landing';

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => apiClient.auth.me(),
    staleTime: 5 * 60 * 1000
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      if (!currentUser) return null;
      const subs = await apiClient.entities.Subscription.filter({ created_by: currentUser.email }, '-created_date', 1);
      return subs?.[0];
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000
  });

  const navigation = [
    { name: t('nav.dashboard'), href: 'Home', icon: LayoutDashboard },
    { name: t('nav.vehicles'), href: 'Vehicles', icon: Car },
    { name: 'Clients', href: 'Clients', icon: UserCircle },
    { name: t('nav.calendar'), href: 'Calendar', icon: Calendar },
    { name: t('nav.analytics'), href: 'Analytics', icon: BarChart3 },
    { name: t('nav.alerts'), href: 'Alerts', icon: AlertTriangle },
    { name: t('nav.emailActivity'), href: 'EmailActivity', icon: Mail },
    { name: 'Automatisation', href: 'Automation', icon: Zap },
    { name: 'Notifications', href: 'NotificationCenter', icon: Bell },
    { name: t('nav.settings'), href: 'Settings', icon: Settings },
  ];

  const adminNavigation = [
    { name: t('nav.users'), href: 'Users', icon: UsersIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {!isLandingPage && (
        <aside className={cn(
          "fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-50 transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-2 px-6 h-16 border-b border-slate-100">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">FleetSync</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = currentPageName === item.href;
                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.href)}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-slate-400")} />
                    {item.name}
                  </Link>
                );
              })}

              {currentUser?.role === 'admin' && (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Administration
                  </div>
                  {adminNavigation.map((item) => {
                    const isActive = currentPageName === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={createPageUrl(item.href)}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-slate-100 text-slate-900"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <item.icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-slate-400")} />
                        {item.name}
                      </Link>
                    );
                  })}
                </>
              )}
            </nav>

            {/* Logout Button */}
            {currentUser && (
              <div className="p-3 border-t border-slate-200">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  onClick={() => apiClient.auth.logout(createPageUrl('Landing'))}
                >
                  <LogOut className="w-5 h-5 mr-3 text-slate-400" />
                  {t('nav.logout') || 'Se déconnecter'}
                </Button>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Main content */}
      <div className={cn("lg:pl-64", isLandingPage && "lg:pl-0")}>

        {/* Desktop notification bell */}
        {currentUser && !isLandingPage && (currentUser?.role === 'admin' || subscription?.status === 'active') && (
          <div className="hidden lg:block fixed top-4 right-6 z-40">
            <NotificationBell />
          </div>
        )}

        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white/80 backdrop-blur-sm border-b border-slate-200 lg:hidden">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900">FleetSync</span>
            </div>
          </div>
          {subscription?.status === 'active' && <NotificationBell />}
        </header>

        {/* Page content */}
        <main>
          <CriticalAlertBanner />
          {children}
        </main>
      </div>
    </div>
  );
}

export default function Layout(props) {
  return (
    <LayoutContent {...props} />
  );
}