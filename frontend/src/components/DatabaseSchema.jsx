/**
 * 🗄️ FLEETSYNC DATABASE - SCHEMA COMPLET
 */

export const DATABASE_SCHEMA = `
-- ========== USERS TABLE ==========
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  
  -- Platform credentials (encrypted)
  turo_credentials JSONB DEFAULT '{}',
  getaround_credentials JSONB DEFAULT '{}',
  
  -- Automation control
  automation_enabled BOOLEAN DEFAULT TRUE,
  kill_switch_active BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  
  -- Metadata
  subscription_plan VARCHAR(50) DEFAULT 'free',
  subscription_expires_at TIMESTAMP,
  total_vehicles INTEGER DEFAULT 0,
  
  CHECK (email ~* '^[^@]+@[^@]+\\.[^@]+$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription ON users(subscription_plan);


-- ========== VEHICLES TABLE ==========
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  vin VARCHAR(17),
  license_plate VARCHAR(20),
  image_url TEXT,
  
  -- Platform presence
  platforms TEXT[] DEFAULT ARRAY[]::text[],
  status VARCHAR(50) DEFAULT 'available', -- available, booked, maintenance
  current_booking_id UUID,
  
  -- Calendar integration
  calendar_provider VARCHAR(50), -- google, outlook, none
  calendar_id VARCHAR(255),
  ical_export_url TEXT,
  
  -- Metadata
  year INTEGER,
  make VARCHAR(100),
  model VARCHAR(100),
  archived BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_platforms ON vehicles USING GIN(platforms);
CREATE INDEX idx_vehicles_status ON vehicles(status);


-- ========== BOOKINGS TABLE ==========
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  
  platform VARCHAR(50) NOT NULL, -- turo, getaround, hunos_rent, manual
  booking_reference VARCHAR(255),
  
  guest_name VARCHAR(255),
  guest_email VARCHAR(255),
  guest_phone VARCHAR(20),
  
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, pending, completed, cancelled
  
  -- Automation tracking
  synced_to_calendar BOOLEAN DEFAULT FALSE,
  sync_attempted_at TIMESTAMP,
  source_email_id VARCHAR(255),
  
  -- Notes
  notes TEXT,
  instructions TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_vehicle_id ON bookings(vehicle_id);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX idx_bookings_status ON bookings(status);


-- ========== AUTOMATIONS TABLE ==========
CREATE TABLE automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  
  type VARCHAR(50) NOT NULL, -- BLOCK_DATES, CONNECT_PLATFORM, REFRESH_SESSION
  platform VARCHAR(50) NOT NULL,
  
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  
  status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, RUNNING, SUCCESS, FAILED, CANCELLED
  
  -- Error tracking
  error_message TEXT,
  error_type VARCHAR(100),
  retry_count INTEGER DEFAULT 0,
  
  manual_review_required BOOLEAN DEFAULT FALSE,
  
  -- Execution timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  executed_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_automations_user_id ON automations(user_id);
CREATE INDEX idx_automations_status ON automations(status);
CREATE INDEX idx_automations_created_at ON automations(created_at DESC);


-- ========== AUTOMATION LOGS TABLE ==========
CREATE TABLE automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  step VARCHAR(255),
  step_status VARCHAR(50), -- success, failed, skipped
  details TEXT,
  
  screenshot_url TEXT, -- S3 URL if failed
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_automation_logs_automation_id ON automation_logs(automation_id);
CREATE INDEX idx_automation_logs_step_status ON automation_logs(step_status);


-- ========== AUDIT LOGS TABLE ==========
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  action VARCHAR(255) NOT NULL, -- create_vehicle, start_automation, kill_switch_active
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  
  old_value JSONB,
  new_value JSONB,
  
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);


-- ========== SESSIONS TABLE ==========
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  
  cookies JSONB NOT NULL, -- Encrypted in application
  user_agent TEXT,
  ip_address VARCHAR(45),
  
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_platform ON sessions(platform);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);


-- ========== KILL SWITCH TABLE ==========
CREATE TABLE kill_switch_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activated_by UUID REFERENCES users(id),
  reason TEXT NOT NULL,
  
  activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deactivated_at TIMESTAMP,
  
  affected_users_count INTEGER DEFAULT 0
);

CREATE INDEX idx_kill_switch_activated_at ON kill_switch_events(activated_at DESC);


-- ========== ALERTS TABLE ==========
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  type VARCHAR(100) NOT NULL, -- vehicle_unclear, low_confidence, sync_error
  severity VARCHAR(50) DEFAULT 'warning', -- info, warning, critical
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  vehicle_id UUID REFERENCES vehicles(id),
  booking_id UUID REFERENCES bookings(id),
  
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_resolved ON alerts(resolved);


-- ========== ALERT RULES TABLE ==========
CREATE TABLE alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  
  condition_type VARCHAR(100) NOT NULL,
  condition_params JSONB,
  
  notification_channels TEXT[] DEFAULT ARRAY['email', 'in_app'],
  severity VARCHAR(50) DEFAULT 'warning',
  
  trigger_count INTEGER DEFAULT 0,
  last_triggered TIMESTAMP,
  
  ai_suggested BOOLEAN DEFAULT FALSE,
  confidence_score FLOAT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alert_rules_user_id ON alert_rules(user_id);
CREATE INDEX idx_alert_rules_enabled ON alert_rules(enabled);


-- ========== MIGRATIONS TABLE (TypeORM) ==========
CREATE TABLE typeorm_metadata (
  type varchar(255) NOT NULL,
  database varchar(255),
  schema varchar(255),
  table varchar(255),
  name varchar(255),
  value text
);


-- ========== TRIGGERS ==========
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Helper function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ========== VIEWS (Optional - for reporting) ==========
CREATE VIEW user_stats AS
SELECT
  u.id,
  u.email,
  COUNT(DISTINCT v.id) as total_vehicles,
  COUNT(DISTINCT b.id) as total_bookings,
  COUNT(DISTINCT CASE WHEN a.status = 'SUCCESS' THEN a.id END) as successful_automations,
  COUNT(DISTINCT CASE WHEN a.status = 'FAILED' THEN a.id END) as failed_automations
FROM users u
LEFT JOIN vehicles v ON u.id = v.user_id
LEFT JOIN bookings b ON u.id = b.user_id
LEFT JOIN automations a ON u.id = a.user_id
GROUP BY u.id, u.email;


CREATE VIEW vehicle_utilization AS
SELECT
  v.id,
  v.name,
  v.user_id,
  ROUND(
    COUNT(b.id)::numeric / 
    ((CURRENT_DATE - v.created_at::date) NULLIF(0, 1))::numeric * 100,
    2
  ) as utilization_percent,
  COUNT(b.id) as total_bookings
FROM vehicles v
LEFT JOIN bookings b ON v.id = b.vehicle_id AND b.status = 'completed'
GROUP BY v.id, v.name, v.user_id;
`;

export default DATABASE_SCHEMA;