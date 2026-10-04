import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'postgres', // Connect to default db first
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function runMigrations() {
  try {
    await client.connect();
    console.log('🔌 Connected to PostgreSQL');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'fleetsync';
    await client.query(`CREATE DATABASE ${dbName}`).catch(() => {
      console.log(`ℹ️  Database ${dbName} already exists`);
    });

    await client.end();

    // Reconnect to the new database
    const appClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: dbName,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    });

    await appClient.connect();
    console.log(`📊 Connected to ${dbName} database`);

    // Create extensions
    await appClient.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    console.log('✅ Extensions created');

    // Users table
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        subscription_status VARCHAR(50) DEFAULT 'inactive',
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        subscription_start_date TIMESTAMP,
        trial_end_date TIMESTAMP,
        calendar_provider VARCHAR(50),
        calendar_access_token TEXT,
        calendar_refresh_token TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Users table created');

    // Vehicles table
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        make VARCHAR(100),
        model VARCHAR(100),
        year INTEGER,
        plate_number VARCHAR(50) NOT NULL,
        vin VARCHAR(50),
        color VARCHAR(50),
        platforms JSONB DEFAULT '[]',
        image_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Vehicles table created');

    // Bookings table
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        platform VARCHAR(100) NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        total_price DECIMAL(10, 2),
        status VARCHAR(50) DEFAULT 'confirmed',
        calendar_event_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Bookings table created');

    // Platform syncs table
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS platform_syncs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        source_platform VARCHAR(100) NOT NULL,
        target_platforms JSONB NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        sync_results JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Platform syncs table created');

    // Automation logs table
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS automation_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
        platform VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        steps JSONB,
        error_message TEXT,
        executed_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      )
    `);
    console.log('✅ Automation logs table created');

    // Notifications table
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        severity VARCHAR(50) DEFAULT 'info',
        booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
        vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Notifications table created');

    // Alert rules table
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS alert_rules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        condition TEXT NOT NULL,
        action TEXT NOT NULL,
        enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Alert rules table created');

    // Customers table
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        company VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Customers table created');

    // Revenue table
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS revenue (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
        booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'EUR',
        platform VARCHAR(100),
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Revenue table created');

    // Email activity table
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS email_activities (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        subject VARCHAR(500) NOT NULL,
        sender VARCHAR(255) NOT NULL,
        recipient VARCHAR(255) NOT NULL,
        received_at TIMESTAMP NOT NULL,
        type VARCHAR(100),
        content TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Email activities table created');

    // User consents table
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS user_consents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        consent_type VARCHAR(100) NOT NULL,
        granted BOOLEAN NOT NULL DEFAULT false,
        granted_at TIMESTAMP,
        revoked_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ User consents table created');

    // PayPal connections table
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS paypal_connections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        account_email VARCHAR(255) NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        connected_date TIMESTAMP DEFAULT NOW(),
        disconnected_date TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ PayPal connections table created');

    // PayPal transactions table
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS paypal_transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        paypal_connection_id UUID REFERENCES paypal_connections(id) ON DELETE SET NULL,
        transaction_id VARCHAR(255) UNIQUE NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        fee_amount DECIMAL(10, 2) DEFAULT 0,
        net_amount DECIMAL(10, 2),
        transaction_date TIMESTAMP NOT NULL,
        transaction_type VARCHAR(100),
        status VARCHAR(50),
        description TEXT,
        payer_email VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ PayPal transactions table created');

    // Subscriptions table
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_name VARCHAR(100) NOT NULL,
        plan_type VARCHAR(50) NOT NULL, -- 'free', 'pro', 'enterprise'
        status VARCHAR(50) NOT NULL, -- 'active', 'cancelled', 'past_due', 'trialing'
        stripe_subscription_id VARCHAR(255),
        stripe_customer_id VARCHAR(255),
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP,
        trial_end_date TIMESTAMP,
        cancellation_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Subscriptions table created');

    // Sync status table
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS sync_statuses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        platform VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL, -- 'synced', 'syncing', 'error', 'paused'
        last_sync TIMESTAMP,
        next_sync TIMESTAMP,
        error_message TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Sync statuses table created');

    // Alerts table
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        severity VARCHAR(50) NOT NULL, -- 'info', 'warning', 'error', 'critical'
        category VARCHAR(100),
        resolved BOOLEAN DEFAULT false,
        resolved_at TIMESTAMP,
        resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Alerts table created');

    // App logs table
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS app_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        page_name VARCHAR(255) NOT NULL,
        accessed_at TIMESTAMP DEFAULT NOW(),
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ App logs table created');

    // Create indexes
    await appClient.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id ON bookings(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);
      CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
      CREATE INDEX IF NOT EXISTS idx_automation_logs_vehicle_id ON automation_logs(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_revenue_vehicle_id ON revenue(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_revenue_booking_id ON revenue(booking_id);
      CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue(date);
      CREATE INDEX IF NOT EXISTS idx_email_activities_received_at ON email_activities(received_at);
      CREATE INDEX IF NOT EXISTS idx_email_activities_sender ON email_activities(sender);
      CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
      CREATE INDEX IF NOT EXISTS idx_paypal_connections_user_id ON paypal_connections(user_id);
      CREATE INDEX IF NOT EXISTS idx_paypal_transactions_transaction_id ON paypal_transactions(transaction_id);
      CREATE INDEX IF NOT EXISTS idx_paypal_transactions_date ON paypal_transactions(transaction_date);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
      CREATE INDEX IF NOT EXISTS idx_sync_statuses_user_id ON sync_statuses(user_id);
      CREATE INDEX IF NOT EXISTS idx_sync_statuses_platform ON sync_statuses(platform);
      CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
      CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);
      CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
      CREATE INDEX IF NOT EXISTS idx_app_logs_user_id ON app_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_app_logs_page_name ON app_logs(page_name);
      CREATE INDEX IF NOT EXISTS idx_app_logs_accessed_at ON app_logs(accessed_at);
    `);
    console.log('✅ Indexes created');

    await appClient.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member'`);
    await appClient.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS owner_id UUID`);
    await appClient.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS platform_accounts JSONB DEFAULT '{}'::jsonb`);
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS records (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        entity_type VARCHAR(80) NOT NULL,
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await appClient.query(`CREATE INDEX IF NOT EXISTS idx_records_user_type ON records(user_id, entity_type)`);
    console.log('✅ FleetSync records store created');

    await appClient.end();
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
