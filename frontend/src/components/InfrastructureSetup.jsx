/**
 * 🚀 FLEETSYNC - INFRASTRUCTURE COMPLÈTE NODE.JS
 * 
 * INSTALLATION & DÉPLOIEMENT
 * 
 * Cette configuration fournit :
 * - API NestJS (Port 3000)
 * - PostgreSQL (Port 5432)
 * - Redis Queue (Port 6379)
 * - Workers Playwright (isolés par client)
 * - Docker-compose pour orchestration
 */

export const INFRASTRUCTURE_SETUP = {
  PROJECT_STRUCTURE: `
fleetsync-cloud/
├── docker-compose.yml
├── .env.example
├── .env
│
├── api/                          # NestJS Backend
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── auth/
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   └── dto/
│   │   ├── users/
│   │   │   ├── users.service.ts
│   │   │   ├── users.controller.ts
│   │   │   └── entities/user.entity.ts
│   │   ├── vehicles/
│   │   │   ├── vehicles.service.ts
│   │   │   ├── vehicles.controller.ts
│   │   │   └── entities/vehicle.entity.ts
│   │   ├── automations/
│   │   │   ├── automations.service.ts
│   │   │   ├── automations.controller.ts
│   │   │   ├── jobs.queue.ts
│   │   │   └── entities/automation.entity.ts
│   │   ├── bookings/
│   │   │   ├── bookings.service.ts
│   │   │   ├── bookings.controller.ts
│   │   │   └── entities/booking.entity.ts
│   │   ├── email/
│   │   │   ├── email.service.ts
│   │   │   └── gmail.client.ts
│   │   ├── ai/
│   │   │   ├── ai.service.ts
│   │   │   └── prompts.ts
│   │   ├── encryption/
│   │   │   └── encryption.service.ts
│   │   ├── kill-switch/
│   │   │   ├── kill-switch.service.ts
│   │   │   └── kill-switch.controller.ts
│   │   ├── common/
│   │   │   ├── filters/
│   │   │   ├── interceptors/
│   │   │   ├── decorators/
│   │   │   └── guards/
│   │   └── database/
│   │       ├── migrations/
│   │       ├── typeorm.config.ts
│   │       └── seeds/
│   └── .env
│
├── workers/                      # Automation Workers (Playwright)
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── main.ts
│   │   ├── queue.consumer.ts
│   │   ├── browser/
│   │   │   ├── browser.pool.ts
│   │   │   ├── session.manager.ts
│   │   │   └── stealth.ts
│   │   ├── platforms/
│   │   │   ├── turo.agent.ts
│   │   │   └── getaround.agent.ts
│   │   ├── jobs/
│   │   │   ├── connect-platform.job.ts
│   │   │   ├── block-dates.job.ts
│   │   │   ├── refresh-session.job.ts
│   │   │   └── disable-automation.job.ts
│   │   ├── monitoring/
│   │   │   ├── logger.ts
│   │   │   ├── error-handler.ts
│   │   │   └── metrics.ts
│   │   └── utils/
│   │       ├── encryption.ts
│   │       ├── proxy.manager.ts
│   │       └── ip.rotation.ts
│   ├── screenshots/
│   └── .env
│
└── docs/
    ├── API.md
    ├── DEPLOYMENT.md
    ├── SECURITY.md
    └── ARCHITECTURE.md
  `,

  ENV_EXAMPLE: `
# ========== ENVIRONMENT (.env) ==========

# Node
NODE_ENV=development
LOG_LEVEL=debug

# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=fleetsync
DB_PASSWORD=your_secure_password_here
DB_NAME=fleetsync
DATABASE_URL=postgresql://fleetsync:your_secure_password_here@postgres:5432/fleetsync

# Redis Queue
REDIS_URL=redis://redis:6379

# JWT & Security
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=24h
ENCRYPTION_KEY=your_32_char_encryption_key_here

# Email (Gmail OAuth)
GMAIL_CLIENT_ID=your_client_id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REDIRECT_URL=http://localhost:3000/auth/gmail/callback

# API
API_PORT=3000
API_HOST=0.0.0.0

# Worker Configuration
WORKER_ID=worker-1
MAX_CONCURRENT_JOBS=3
JOB_TIMEOUT_MS=300000

# Platform Credentials (encrypted)
TURO_API_KEY=your_turo_api_key_if_available
GETAROUND_API_KEY=your_getaround_api_key_if_available

# Proxy (optional - for IP rotation)
PROXY_URL=http://proxy:port
PROXY_USERNAME=username
PROXY_PASSWORD=password

# Monitoring
SENTRY_DSN=your_sentry_dsn_for_error_tracking
SLACK_WEBHOOK=your_slack_webhook_for_alerts

# Kill Switch
KILL_SWITCH_ENABLED=false
KILL_SWITCH_REASON=null
  \`,

  INSTALLATION: \`
# 1. Clone & Setup
git clone <repo>
cd fleetsync-cloud
cp .env.example .env

# 2. Update .env with your values
nano .env

# 3. Start infrastructure
docker-compose up -d

# 4. Run database migrations
docker-compose exec api npm run db:migrate

# 5. Seed initial data (optional)
docker-compose exec api npm run db:seed

# 6. Check services
docker-compose logs -f

# Access points:
# - API: http://localhost:3000
# - pgAdmin: http://localhost:5050 (optional)
# - Redis Commander: http://localhost:8081 (optional)
  `
};

export default INFRASTRUCTURE_SETUP;