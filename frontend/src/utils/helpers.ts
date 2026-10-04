/**
 * Utility functions for the FleetSync application
 */

/**
 * Creates a URL for a specific page
 * @param pageName - Name of the page to navigate to
 * @returns - The URL for the specified page
 */
export const createPageUrl = (pageName: string): string => {
  const pageRoutes: Record<string, string> = {
    'Home': '/home',
    'Vehicles': '/vehicles',
    'Bookings': '/bookings',
    'Calendar': '/calendar',
    'Analytics': '/analytics',
    'Reports': '/reports',
    'Settings': '/settings',
    'Users': '/users',
    'Clients': '/clients',
    'Notifications': '/notifications',
    'Alerts': '/alerts',
    'AlertRules': '/alertrules',
    'Automation': '/automation',
    'Login': '/login',
    'Register': '/register',
    'ForgotPassword': '/forgot-password',
    'ResetPassword': '/reset-password',
    'Profile': '/profile',
    'Billing': '/billing',
    'Subscription': '/subscription',
    'Pricing': '/pricing',
    'Landing': '/',
    'PrivacyPolicy': '/privacypolicy',
    'TermsOfService': '/termsofservice',
    'CookiePolicy': '/cookiepolicy',
    'LegalNotice': '/legalnotice',
    'Documentation': '/documentation',
    'EmailActivity': '/emailactivity',
    'NotificationCenter': '/notificationcenter',
  };

  return pageRoutes[pageName] || '/';
};

/**
 * Helper function to get the current user's role
 * @returns - The user's role or null if not authenticated
 */
export const getUserRole = (): string | null => {
  const userData = localStorage.getItem('user_data');
  if (userData) {
    try {
      const parsedData = JSON.parse(userData);
      return parsedData.role || null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  return null;
};

/**
 * Helper function to check if user has a specific permission
 * @param permission - The permission to check
 * @returns - True if user has the permission, false otherwise
 */
export const hasPermission = (permission: string): boolean => {
  const userRole = getUserRole();
  // Define permissions based on roles
  const permissions: Record<string, string[]> = {
    admin: ['read', 'write', 'delete', 'manage_users', 'manage_settings'],
    manager: ['read', 'write', 'manage_team'],
    user: ['read', 'own_write'],
    guest: ['read']
  };

  const userPermissions = permissions[userRole!] || [];
  return userPermissions.includes(permission);
};

/**
 * Format currency based on locale
 * @param amount - The amount to format
 * @param currency - The currency code (default: USD)
 * @returns - Formatted currency string
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Format date based on locale
 * @param date - The date to format
 * @param options - Formatting options
 * @returns - Formatted date string
 */
export const formatDate = (
  date: Date | string,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
): string => {
  return new Intl.DateTimeFormat('en-US', options).format(new Date(date));
};

/**
 * Debounce function to limit the rate at which a function can fire
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns - The debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>): void => {
    const later = () => {
      if (timeout) clearTimeout(timeout);
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};