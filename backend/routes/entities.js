import express from 'express';
const router = express.Router();
import { authenticateToken } from '../middleware/auth.js';

// Mock data stores for different entities
let mockVehicles = [
  { id: '1', name: 'Tesla Model 3', license_plate: 'ABC-123', vin: '1HGBH41JXMN109186', status: 'available', created_date: new Date().toISOString() },
  { id: '2', name: 'BMW X5', license_plate: 'XYZ-789', vin: '2HGBH41JXMN109187', status: 'booked', created_date: new Date().toISOString() }
];

let mockBookings = [
  { id: '1', vehicle_id: '1', start_date: '2023-01-01', end_date: '2023-01-07', status: 'confirmed', created_date: new Date().toISOString() },
  { id: '2', vehicle_id: '2', start_date: '2023-02-01', end_date: '2023-02-07', status: 'pending', created_date: new Date().toISOString() }
];

let mockNotifications = [
  { id: '1', title: 'Booking Confirmed', message: 'Your booking has been confirmed', read: false, created_date: new Date().toISOString() },
  { id: '2', title: 'Maintenance Alert', message: 'Vehicle requires maintenance', read: true, created_date: new Date().toISOString() }
];

let mockAlerts = [
  { id: '1', title: 'Low Availability', message: 'Vehicle availability below 20%', severity: 'warning', created_date: new Date().toISOString() },
  { id: '2', title: 'High Costs', message: 'Monthly costs exceeded budget', severity: 'error', created_date: new Date().toISOString() }
];

let mockCustomers = [
  { id: '1', name: 'John Doe', email: 'john@example.com', phone: '+1234567890', created_date: new Date().toISOString() },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '+0987654321', created_date: new Date().toISOString() }
];

let mockUsers = [
  { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin', created_date: new Date().toISOString() },
  { id: '2', name: 'Regular User', email: 'user@example.com', role: 'user', created_date: new Date().toISOString() }
];

let mockAlertRules = [
  { id: '1', name: 'Availability Threshold', condition: 'availability < 20%', action: 'notify_admin', enabled: true, created_date: new Date().toISOString() }
];

let mockRevenue = [
  { id: '1', vehicle_id: '1', amount: 1200, date: '2023-01-15', platform: 'turo', created_date: new Date().toISOString() },
  { id: '2', vehicle_id: '2', amount: 950, date: '2023-02-15', platform: 'getaround', created_date: new Date().toISOString() }
];

let mockAutomationLogs = [
  { id: '1', action: 'block_dates', status: 'success', executed_at: new Date().toISOString(), details: 'Dates blocked successfully' },
  { id: '2', action: 'sync_calendar', status: 'failed', executed_at: new Date().toISOString(), details: 'Calendar sync failed' }
];

let mockPlatformSyncs = [
  { id: '1', booking_id: '1', target_platforms: ['turo', 'getaround'], status: 'success', created_date: new Date().toISOString() }
];

let mockSyncStatuses = [
  { id: '1', status: 'synced', last_sync: new Date().toISOString(), platform: 'turo' }
];

let mockEmailActivities = [
  { id: '1', subject: 'Booking Confirmation', sender: 'noreply@turo.com', received_at: new Date().toISOString(), type: 'booking' },
  { id: '2', subject: 'Cancellation Notice', sender: 'noreply@getaround.com', received_at: new Date().toISOString(), type: 'cancellation' }
];

let mockUserConsents = [
  { id: '1', user_id: '1', consent_type: 'marketing', granted: true, created_date: new Date().toISOString() }
];

let mockPayPalConnections = [
  { id: '1', user_id: '1', account_email: 'paypal@example.com', connected_date: new Date().toISOString() }
];

let mockPayPalTransactions = [
  { id: '1', transaction_id: 'txn_12345', amount: 1200, currency: 'USD', transaction_date: new Date().toISOString() }
];

let mockSubscriptions = [
  { id: '1', user_id: '1', plan: 'premium', status: 'active', start_date: new Date().toISOString(), end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString() }
];

// Helper function to parse query parameters
const parseQueryParams = (req) => {
  const { sort, limit, filter } = req.query;
  return {
    sort: sort || '-created_date',
    limit: parseInt(limit) || 100,
    filter: filter ? JSON.parse(filter) : {}
  };
};

// Helper function to apply sorting and limiting
const applySortAndLimit = (data, sort, limit) => {
  const [field, direction] = sort.startsWith('-') ? [sort.substring(1), 'desc'] : [sort, 'asc'];
  
  data.sort((a, b) => {
    if (direction === 'asc') {
      return a[field] > b[field] ? 1 : -1;
    } else {
      return a[field] < b[field] ? 1 : -1;
    }
  });
  
  return data.slice(0, limit);
};

// Helper function to apply filters
const applyFilters = (data, filter) => {
  if (!filter || Object.keys(filter).length === 0) return data;
  
  return data.filter(item => {
    for (const [key, value] of Object.entries(filter)) {
      if (typeof value === 'object' && value.$in) {
        // Handle $in operator
        if (!value.$in.includes(item[key])) return false;
      } else if (item[key] !== value) {
        return false;
      }
    }
    return true;
  });
};

// Vehicle entity routes
router.get('/vehicle', authenticateToken, (req, res) => {
  try {
    const { sort, limit, filter } = parseQueryParams(req);
    let filteredData = applyFilters([...mockVehicles], filter);
    const sortedLimitedData = applySortAndLimit(filteredData, sort, limit);
    res.json(sortedLimitedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

router.post('/vehicle', authenticateToken, (req, res) => {
  try {
    const newVehicle = { ...req.body, id: Date.now().toString() };
    mockVehicles.push(newVehicle);
    res.status(201).json(newVehicle);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
});

router.patch('/vehicle/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const index = mockVehicles.findIndex(v => v.id === id);
    if (index === -1) return res.status(404).json({ error: 'Vehicle not found' });
    
    mockVehicles[index] = { ...mockVehicles[index], ...req.body };
    res.json(mockVehicles[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

router.delete('/vehicle/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const index = mockVehicles.findIndex(v => v.id === id);
    if (index === -1) return res.status(404).json({ error: 'Vehicle not found' });
    
    mockVehicles.splice(index, 1);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

// Booking entity routes
router.get('/booking', authenticateToken, (req, res) => {
  try {
    const { sort, limit, filter } = parseQueryParams(req);
    let filteredData = applyFilters([...mockBookings], filter);
    const sortedLimitedData = applySortAndLimit(filteredData, sort, limit);
    res.json(sortedLimitedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

router.get('/booking/filter', authenticateToken, (req, res) => {
  try {
    const { sort, limit, filter } = parseQueryParams(req);
    let filteredData = applyFilters([...mockBookings], filter);
    const sortedLimitedData = applySortAndLimit(filteredData, sort, limit);
    res.json(sortedLimitedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to filter bookings' });
  }
});

router.patch('/booking/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const index = mockBookings.findIndex(b => b.id === id);
    if (index === -1) return res.status(404).json({ error: 'Booking not found' });
    
    mockBookings[index] = { ...mockBookings[index], ...req.body };
    res.json(mockBookings[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Notification entity routes
router.get('/notification', authenticateToken, (req, res) => {
  try {
    const { sort, limit, filter } = parseQueryParams(req);
    let filteredData = applyFilters([...mockNotifications], filter);
    const sortedLimitedData = applySortAndLimit(filteredData, sort, limit);
    res.json(sortedLimitedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.get('/notification/filter', authenticateToken, (req, res) => {
  try {
    const { sort, limit, filter } = parseQueryParams(req);
    let filteredData = applyFilters([...mockNotifications], filter);
    const sortedLimitedData = applySortAndLimit(filteredData, sort, limit);
    res.json(sortedLimitedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to filter notifications' });
  }
});

router.patch('/notification/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const index = mockNotifications.findIndex(n => n.id === id);
    if (index === -1) return res.status(404).json({ error: 'Notification not found' });
    
    mockNotifications[index] = { ...mockNotifications[index], ...req.body };
    res.json(mockNotifications[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

router.delete('/notification/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const index = mockNotifications.findIndex(n => n.id === id);
    if (index === -1) return res.status(404).json({ error: 'Notification not found' });
    
    mockNotifications.splice(index, 1);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Alert entity routes
router.get('/alert', authenticateToken, (req, res) => {
  try {
    const { sort, limit, filter } = parseQueryParams(req);
    let filteredData = applyFilters([...mockAlerts], filter);
    const sortedLimitedData = applySortAndLimit(filteredData, sort, limit);
    res.json(sortedLimitedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

router.get('/alert/filter', authenticateToken, (req, res) => {
  try {
    const { sort, limit, filter } = parseQueryParams(req);
    let filteredData = applyFilters([...mockAlerts], filter);
    const sortedLimitedData = applySortAndLimit(filteredData, sort, limit);
    res.json(sortedLimitedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to filter alerts' });
  }
});

router.patch('/alert/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const index = mockAlerts.findIndex(a => a.id === id);
    if (index === -1) return res.status(404).json({ error: 'Alert not found' });
    
    mockAlerts[index] = { ...mockAlerts[index], ...req.body };
    res.json(mockAlerts[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// Customer entity routes
router.get('/customer', authenticateToken, (req, res) => {
  try {
    const { sort, limit, filter } = parseQueryParams(req);
    let filteredData = applyFilters([...mockCustomers], filter);
    const sortedLimitedData = applySortAndLimit(filteredData, sort, limit);
    res.json(sortedLimitedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.post('/customer', authenticateToken, (req, res) => {
  try {
    const newCustomer = { ...req.body, id: Date.now().toString() };
    mockCustomers.push(newCustomer);
    res.status(201).json(newCustomer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

router.patch('/customer/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const index = mockCustomers.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ error: 'Customer not found' });
    
    mockCustomers[index] = { ...mockCustomers[index], ...req.body };
    res.json(mockCustomers[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

router.delete('/customer/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const index = mockCustomers.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ error: 'Customer not found' });
    
    mockCustomers.splice(index, 1);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// User entity routes
router.get('/user', authenticateToken, (req, res) => {
  try {
    const { sort, limit, filter } = parseQueryParams(req);
    let filteredData = applyFilters([...mockUsers], filter);
    const sortedLimitedData = applySortAndLimit(filteredData, sort, limit);
    res.json(sortedLimitedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.patch('/user/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) return res.status(404).json({ error: 'User not found' });
    
    mockUsers[index] = { ...mockUsers[index], ...req.body };
    res.json(mockUsers[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/user/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) return res.status(404).json({ error: 'User not found' });
    
    mockUsers.splice(index, 1);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// AlertRule entity routes
router.get('/alert-rule', authenticateToken, (req, res) => {
  try {
    const { sort, limit, filter } = parseQueryParams(req);
    let filteredData = applyFilters([...mockAlertRules], filter);
    const sortedLimitedData = applySortAndLimit(filteredData, sort, limit);
    res.json(sortedLimitedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alert rules' });
  }
});

router.post('/alert-rule', authenticateToken, (req, res) => {
  try {
    const newAlertRule = { ...req.body, id: Date.now().toString() };
    mockAlertRules.push(newAlertRule);
    res.status(201).json(newAlertRule);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create alert rule' });
  }
});

router.patch('/alert-rule/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const index = mockAlertRules.findIndex(ar => ar.id === id);
    if (index === -1) return res.status(404).json({ error: 'Alert rule not found' });
    
    mockAlertRules[index] = { ...mockAlertRules[index], ...req.body };
    res.json(mockAlertRules[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update alert rule' });
  }
});

router.delete('/alert-rule/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const index = mockAlertRules.findIndex(ar => ar.id === id);
    if (index === -1) return res.status(404).json({ error: 'Alert rule not found' });
    
    mockAlertRules.splice(index, 1);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete alert rule' });
  }
});

// Revenue entity routes
router.get('/revenue', authenticateToken, (req, res) => {
  try {
    const { sort, limit, filter } = parseQueryParams(req);
    let filteredData = applyFilters([...mockRevenue], filter);
    const sortedLimitedData = applySortAndLimit(filteredData, sort, limit);
    res.json(sortedLimitedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch revenue' });
  }
});

// AutomationLog entity routes
router.get('/automation-log', authenticateToken, (req, res) => {
  try {
    const { sort, limit, filter } = parseQueryParams(req);
    let filteredData = applyFilters([...mockAutomationLogs], filter);
    const sortedLimitedData = applySortAndLimit(filteredData, sort, limit);
    res.json(sortedLimitedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch automation logs' });
  }
});

// PlatformSync entity routes
router.get('/platform-sync', authenticateToken, (req, res) => {
  try {
    const { sort, limit, filter } = parseQueryParams(req);
    let filteredData = applyFilters([...mockPlatformSyncs], filter);
    const sortedLimitedData = applySortAndLimit(filteredData, sort, limit);
    res.json(sortedLimitedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch platform syncs' });
  }
});

// SyncStatus entity routes
router.get('/sync-status', authenticateToken, (req, res) => {
  try {
    const { sort, limit, filter } = parseQueryParams(req);
    let filteredData = applyFilters([...mockSyncStatuses], filter);
    const sortedLimitedData = applySortAndLimit(filteredData, sort, limit);
    res.json(sortedLimitedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sync statuses' });
  }
});

router.patch('/sync-status/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const index = mockSyncStatuses.findIndex(ss => ss.id === id);
    if (index === -1) return res.status(404).json({ error: 'Sync status not found' });
    
    mockSyncStatuses[index] = { ...mockSyncStatuses[index], ...req.body };
    res.json(mockSyncStatuses[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update sync status' });
  }
});

// EmailActivity entity routes
router.get('/email-activity', authenticateToken, (req, res) => {
  try {
    const { sort, limit, filter } = parseQueryParams(req);
    let filteredData = applyFilters([...mockEmailActivities], filter);
    const sortedLimitedData = applySortAndLimit(filteredData, sort, limit);
    res.json(sortedLimitedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch email activities' });
  }
});

// UserConsent entity routes
router.get('/user-consent', authenticateToken, (req, res) => {
  try {
    const { sort, limit, filter } = parseQueryParams(req);
    let filteredData = applyFilters([...mockUserConsents], filter);
    const sortedLimitedData = applySortAndLimit(filteredData, sort, limit);
    res.json(sortedLimitedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user consents' });
  }
});

router.post('/user-consent', authenticateToken, (req, res) => {
  try {
    const newUserConsent = { ...req.body, id: Date.now().toString() };
    mockUserConsents.push(newUserConsent);
    res.status(201).json(newUserConsent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user consent' });
  }
});

router.patch('/user-consent/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const index = mockUserConsents.findIndex(uc => uc.id === id);
    if (index === -1) return res.status(404).json({ error: 'User consent not found' });
    
    mockUserConsents[index] = { ...mockUserConsents[index], ...req.body };
    res.json(mockUserConsents[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user consent' });
  }
});

// PayPalConnection entity routes
router.get('/paypal-connection', authenticateToken, (req, res) => {
  try {
    const { sort, limit, filter } = parseQueryParams(req);
    let filteredData = applyFilters([...mockPayPalConnections], filter);
    const sortedLimitedData = applySortAndLimit(filteredData, sort, limit);
    res.json(sortedLimitedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch PayPal connections' });
  }
});

router.post('/paypal-connection', authenticateToken, (req, res) => {
  try {
    const newPayPalConnection = { ...req.body, id: Date.now().toString() };
    mockPayPalConnections.push(newPayPalConnection);
    res.status(201).json(newPayPalConnection);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create PayPal connection' });
  }
});

router.delete('/paypal-connection/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const index = mockPayPalConnections.findIndex(pc => pc.id === id);
    if (index === -1) return res.status(404).json({ error: 'PayPal connection not found' });
    
    mockPayPalConnections.splice(index, 1);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete PayPal connection' });
  }
});

// PayPalTransaction entity routes
router.get('/paypal-transaction', authenticateToken, (req, res) => {
  try {
    const { sort, limit, filter } = parseQueryParams(req);
    let filteredData = applyFilters([...mockPayPalTransactions], filter);
    const sortedLimitedData = applySortAndLimit(filteredData, sort, limit);
    res.json(sortedLimitedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch PayPal transactions' });
  }
});

// Subscription entity routes
router.get('/subscription/filter', authenticateToken, (req, res) => {
  try {
    const { sort, limit, filter } = parseQueryParams(req);
    let filteredData = applyFilters([...mockSubscriptions], filter);
    const sortedLimitedData = applySortAndLimit(filteredData, sort, limit);
    res.json(sortedLimitedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to filter subscriptions' });
  }
});

export default router;
