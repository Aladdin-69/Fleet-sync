// Permissions par rôle
const rolePermissions = {
  admin: [
    'manage_vehicles',
    'manage_bookings',
    'view_alerts',
    'manage_alerts',
    'view_emails',
    'view_calendar',
    'manage_settings',
    'invite_users'
  ],
  manager: [
    'manage_vehicles',
    'manage_bookings',
    'view_alerts',
    'manage_alerts',
    'view_emails',
    'view_calendar'
  ],
  user: [
    'view_alerts',
    'view_emails',
    'view_calendar'
  ]
};

export const hasPermission = (user, permission) => {
  if (!user) return false;
  
  // Admin a toutes les permissions
  if (user.role === 'admin') return true;
  
  // Vérifier les permissions personnalisées
  if (user.permissions?.includes(permission)) return true;
  
  // Vérifier les permissions du rôle étendu
  const role = user.extended_role || 'user';
  return rolePermissions[role]?.includes(permission) || false;
};

export const canAccessPage = (user, pageName) => {
  if (!user) return false;
  
  const pagePermissions = {
    'Vehicles': 'manage_vehicles',
    'Alerts': 'view_alerts',
    'EmailActivity': 'view_emails',
    'Calendar': 'view_calendar',
    'Settings': 'manage_settings',
    'Users': 'invite_users'
  };
  
  return hasPermission(user, pagePermissions[pageName]);
};

export const getRoleLabel = (role) => {
  const labels = {
    admin: 'Administrateur',
    manager: 'Gestionnaire',
    user: 'Utilisateur'
  };
  return labels[role] || role;
};

export const getPermissionLabel = (permission) => {
  const labels = {
    manage_vehicles: 'Gérer les véhicules',
    manage_bookings: 'Gérer les réservations',
    view_alerts: 'Voir les alertes',
    manage_alerts: 'Gérer les alertes',
    view_emails: 'Voir les emails',
    view_calendar: 'Voir le calendrier',
    manage_settings: 'Gérer les paramètres',
    invite_users: 'Inviter des utilisateurs'
  };
  return labels[permission] || permission;
};