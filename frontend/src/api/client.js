// API Client for FleetSync Self-Hosted Backend
// This replaces the Base44 SDK and connects to your own server

// Default to localhost for development
// Update VITE_API_URL in .env.local to point to your production server
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class APIClient {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Auth methods
  auth = {
    register: (email, password, name) =>
      this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      }),

    login: async (email, password) => {
      const data = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data.token) {
        this.setToken(data.token);
      }
      return data;
    },

    logout: () => {
      this.setToken(null);
      return this.request('/auth/logout', { method: 'POST' });
    },

    me: () => this.request('/auth/me'),

    updateMe: (updates) =>
      this.request('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    
    isAuthenticated: async () => {
      if (!this.token) {
        return false;
      }
      try {
        await this.request('/auth/me');
        return true;
      } catch (error) {
        return false;
      }
    },
    
    redirectToLogin: (returnUrl) => {
      // Store the return URL in localStorage so we can redirect back after login
      if (returnUrl) {
        localStorage.setItem('returnUrl', returnUrl);
      }
      // Redirect to login page
      window.location.href = '/login';
    },
  };

  // Users methods
  users = {
    inviteUser: (email, role) =>
      this.request('/users/invite', {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      }),
  };

  // Vehicles methods
  vehicles = {
    list: () => this.request('/vehicles'),

    get: (id) => this.request(`/vehicles/${id}`),

    create: (vehicleData) =>
      this.request('/vehicles', {
        method: 'POST',
        body: JSON.stringify(vehicleData),
      }),

    update: (id, updates) =>
      this.request(`/vehicles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),

    delete: (id) =>
      this.request(`/vehicles/${id}`, {
        method: 'DELETE',
      }),
  };

  // Bookings methods
  bookings = {
    list: () => this.request('/bookings'),

    get: (id) => this.request(`/bookings/${id}`),

    create: (bookingData) =>
      this.request('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      }),

    update: (id, updates) =>
      this.request(`/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),

    delete: (id) =>
      this.request(`/bookings/${id}`, {
        method: 'DELETE',
      }),

    sync: (id, sourcePlatform) =>
      this.request(`/bookings/${id}/sync`, {
        method: 'POST',
        body: JSON.stringify({ source_platform: sourcePlatform }),
      }),
  };

  // Calendar methods
  calendar = {
    connect: (provider) =>
      this.request('/calendar/connect', {
        method: 'POST',
        body: JSON.stringify({ provider }),
      }),

    sync: (bookingId) =>
      this.request(`/calendar/sync/${bookingId}`, {
        method: 'POST',
      }),

    disconnect: () =>
      this.request('/calendar/disconnect', {
        method: 'POST',
      }),
  };

  // Stripe methods
  stripe = {
    createCheckout: (priceId, trialDays = 3) =>
      this.request('/stripe/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ price_id: priceId, trial_days: trialDays }),
      }),

    createPortal: () =>
      this.request('/stripe/create-portal', {
        method: 'POST',
      }),
  };

  // Automation methods
  automation = {
    logs: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/automation/logs?${query}`);
    },

    stats: () => this.request('/automation/stats'),

    trigger: (bookingId, action) =>
      this.request('/automation/trigger', {
        method: 'POST',
        body: JSON.stringify({ booking_id: bookingId, action }),
      }),
  };

  // Notifications methods
  notifications = {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/notifications?${query}`);
    },

    markAsRead: (id) =>
      this.request(`/notifications/${id}/read`, {
        method: 'PATCH',
      }),

    markAllAsRead: () =>
      this.request('/notifications/read-all', {
        method: 'POST',
      }),

    delete: (id) =>
      this.request(`/notifications/${id}`, {
        method: 'DELETE',
      }),

    getUnreadCount: () => this.request('/notifications/unread-count'),
  };

  // Integrations methods
  integrations = {
    Core: {
      InvokeLLM: (params) =>
        this.request('/integrations/core/invoke-llm', {
          method: 'POST',
          body: JSON.stringify(params),
        }),

      UploadFile: (params) =>
        this.request('/integrations/core/upload-file', {
          method: 'POST',
          body: JSON.stringify(params),
        }),

      GenerateImage: (params) =>
        this.request('/integrations/core/generate-image', {
          method: 'POST',
          body: JSON.stringify(params),
        }),
    }
  };

  // Functions methods
  functions = {
    invoke: (functionName, params) =>
      this.request(`/functions/invoke/${functionName}`, {
        method: 'POST',
        body: JSON.stringify(params),
      }),
  };

  // App logs methods
  appLogs = {
    logUserInApp: (pageName) =>
      this.request('/app-logs/log-user-in-app', {
        method: 'POST',
        body: JSON.stringify({ page_name: pageName }),
      }),
  };

  // Entities methods
  entities = {
    PlatformSync: {
      list: (sort = '-created_date', limit = 10) => {
        const params = new URLSearchParams();
        if (sort) params.append('sort', sort);
        if (limit) params.append('limit', limit);
        const queryString = params.toString();
        return this.request(`/entities/platform-sync${queryString ? '?' + queryString : ''}`);
      }
    },
    
    AutomationLog: {
      list: (sort = '-executed_at', limit = 100) => {
        const params = new URLSearchParams();
        if (sort) params.append('sort', sort);
        if (limit) params.append('limit', limit);
        const queryString = params.toString();
        return this.request(`/entities/automation-log${queryString ? '?' + queryString : ''}`);
      }
    },
    
    Revenue: {
      list: (sort = '-date', limit = 100) => {
        const params = new URLSearchParams();
        if (sort) params.append('sort', sort);
        if (limit) params.append('limit', limit);
        const queryString = params.toString();
        return this.request(`/entities/revenue${queryString ? '?' + queryString : ''}`);
      }
    },
    
    Vehicle: {
      list: (sort = '-created_date', limit = 100) => {
        const params = new URLSearchParams();
        if (sort) params.append('sort', sort);
        if (limit) params.append('limit', limit);
        const queryString = params.toString();
        return this.request(`/entities/vehicle${queryString ? '?' + queryString : ''}`);
      },
      
      create: (data) =>
        this.request('/entities/vehicle', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
        
      update: (id, updates) =>
        this.request(`/entities/vehicle/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        }),
        
      delete: (id) =>
        this.request(`/entities/vehicle/${id}`, {
          method: 'DELETE',
        })
    },
    
    Notification: {
      list: (sort = '-created_date', limit = 50) => {
        const params = new URLSearchParams();
        if (sort) params.append('sort', sort);
        if (limit) params.append('limit', limit);
        const queryString = params.toString();
        return this.request(`/entities/notification${queryString ? '?' + queryString : ''}`);
      },
      
      update: (id, updates) =>
        this.request(`/entities/notification/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        }),
        
      filter: (filters, sort = '-created_date', limit = 10) => {
        const params = new URLSearchParams();
        if (filters) params.append('filter', JSON.stringify(filters));
        if (sort) params.append('sort', sort);
        if (limit) params.append('limit', limit);
        const queryString = params.toString();
        return this.request(`/entities/notification/filter${queryString ? '?' + queryString : ''}`);
      },
      
      subscribe: (callback) => {
        // WebSocket or SSE connection for real-time notifications
        // This would typically connect to a real-time endpoint
        console.warn('Real-time notification subscription not implemented');
        return { unsubscribe: () => {} }; // Mock unsubscribe function
      }
    },
    
    Booking: {
      list: (sort = '-created_date', limit = 100) => {
        const params = new URLSearchParams();
        if (sort) params.append('sort', sort);
        if (limit) params.append('limit', limit);
        const queryString = params.toString();
        return this.request(`/entities/booking${queryString ? '?' + queryString : ''}`);
      },
      
      filter: (filters, sort = '-created_date', limit = 100) => {
        const params = new URLSearchParams();
        if (filters) params.append('filter', JSON.stringify(filters));
        if (sort) params.append('sort', sort);
        if (limit) params.append('limit', limit);
        const queryString = params.toString();
        return this.request(`/entities/booking/filter${queryString ? '?' + queryString : ''}`);
      },
      
      update: (id, updates) =>
        this.request(`/entities/booking/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        })
    },
    
    AlertRule: {
      list: (sort = '-created_date', limit = 100) => {
        const params = new URLSearchParams();
        if (sort) params.append('sort', sort);
        if (limit) params.append('limit', limit);
        const queryString = params.toString();
        return this.request(`/entities/alert-rule${queryString ? '?' + queryString : ''}`);
      },
      
      create: (data) =>
        this.request('/entities/alert-rule', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
        
      update: (id, updates) =>
        this.request(`/entities/alert-rule/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        }),
        
      delete: (id) =>
        this.request(`/entities/alert-rule/${id}`, {
          method: 'DELETE',
        })
    },
    
    UserConsent: {
      list: (sort = '-created_date', limit = 10) => {
        const params = new URLSearchParams();
        if (sort) params.append('sort', sort);
        if (limit) params.append('limit', limit);
        const queryString = params.toString();
        return this.request(`/entities/user-consent${queryString ? '?' + queryString : ''}`);
      },
      
      update: (id, updates) =>
        this.request(`/entities/user-consent/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        }),
        
      create: (data) =>
        this.request('/entities/user-consent', {
          method: 'POST',
          body: JSON.stringify(data),
        })
    },
    
    PayPalConnection: {
      list: (sort = '-created_date', limit = 10) => {
        const params = new URLSearchParams();
        if (sort) params.append('sort', sort);
        if (limit) params.append('limit', limit);
        const queryString = params.toString();
        return this.request(`/entities/paypal-connection${queryString ? '?' + queryString : ''}`);
      },
      
      create: (data) =>
        this.request('/entities/paypal-connection', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
        
      delete: (id) =>
        this.request(`/entities/paypal-connection/${id}`, {
          method: 'DELETE',
        })
    },
    
    PayPalTransaction: {
      list: (sort = '-transaction_date', limit = 10) => {
        const params = new URLSearchParams();
        if (sort) params.append('sort', sort);
        if (limit) params.append('limit', limit);
        const queryString = params.toString();
        return this.request(`/entities/paypal-transaction${queryString ? '?' + queryString : ''}`);
      }
    },
    
    Subscription: {
      filter: (filters, sort = '-created_date', limit = 10) => {
        const params = new URLSearchParams();
        if (filters) params.append('filter', JSON.stringify(filters));
        if (sort) params.append('sort', sort);
        if (limit) params.append('limit', limit);
        const queryString = params.toString();
        return this.request(`/entities/subscription/filter${queryString ? '?' + queryString : ''}`);
      }
    },
    
    SyncStatus: {
      list: (sort = '-created_date', limit = 10) => {
        const params = new URLSearchParams();
        if (sort) params.append('sort', sort);
        if (limit) params.append('limit', limit);
        const queryString = params.toString();
        return this.request(`/entities/sync-status${queryString ? '?' + queryString : ''}`);
      },
      
      update: (id, updates) =>
        this.request(`/entities/sync-status/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        })
    },
    
    EmailActivity: {
      list: (sort = '-received_at', limit = 50) => {
        const params = new URLSearchParams();
        if (sort) params.append('sort', sort);
        if (limit) params.append('limit', limit);
        const queryString = params.toString();
        return this.request(`/entities/email-activity${queryString ? '?' + queryString : ''}`);
      }
    },
    
    Customer: {
      list: (sort = '-created_date', limit = 100) => {
        const params = new URLSearchParams();
        if (sort) params.append('sort', sort);
        if (limit) params.append('limit', limit);
        const queryString = params.toString();
        return this.request(`/entities/customer${queryString ? '?' + queryString : ''}`);
      },
      
      create: (data) =>
        this.request('/entities/customer', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
        
      update: (id, updates) =>
        this.request(`/entities/customer/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        }),
        
      delete: (id) =>
        this.request(`/entities/customer/${id}`, {
          method: 'DELETE',
        })
    },
    
    Alert: {
      list: (sort = '-created_date', limit = 100) => {
        const params = new URLSearchParams();
        if (sort) params.append('sort', sort);
        if (limit) params.append('limit', limit);
        const queryString = params.toString();
        return this.request(`/entities/alert${queryString ? '?' + queryString : ''}`);
      },
      
      filter: (filters, sort = '-created_date', limit = 10) => {
        const params = new URLSearchParams();
        if (filters) params.append('filter', JSON.stringify(filters));
        if (sort) params.append('sort', sort);
        if (limit) params.append('limit', limit);
        const queryString = params.toString();
        return this.request(`/entities/alert/filter${queryString ? '?' + queryString : ''}`);
      },
      
      update: (id, updates) =>
        this.request(`/entities/alert/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        })
    },
    
    User: {
      list: (sort = '-created_date', limit = 100) => {
        const params = new URLSearchParams();
        if (sort) params.append('sort', sort);
        if (limit) params.append('limit', limit);
        const queryString = params.toString();
        return this.request(`/entities/user${queryString ? '?' + queryString : ''}`);
      },
      
      update: (id, updates) =>
        this.request(`/entities/user/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        }),
        
      delete: (id) =>
        this.request(`/entities/user/${id}`, {
          method: 'DELETE',
        })
    }
  };
}

// Create and export a singleton instance
const apiClient = new APIClient();

export default apiClient;
