/**
 * 🐳 DOCKER COMPOSE & DOCKERFILES
 */

export const DOCKER_FILES = {
  // ========== docker-compose.yml ==========
  DOCKER_COMPOSE: `version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: fleetsync-db
    environment:
      POSTGRES_USER: \${DB_USER:-fleetsync}
      POSTGRES_PASSWORD: \${DB_PASSWORD:-dev_password_change_me}
      POSTGRES_DB: \${DB_NAME:-fleetsync}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "\${DB_PORT:-5432}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${DB_USER:-fleetsync}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - fleetsync

  redis:
    image: redis:7-alpine
    container_name: fleetsync-queue
    ports:
      - "\${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - fleetsync

  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    container_name: fleetsync-api
    environment:
      NODE_ENV: \${NODE_ENV:-development}
      DATABASE_URL: postgresql://\${DB_USER:-fleetsync}:\${DB_PASSWORD:-dev_password_change_me}@postgres:5432/\${DB_NAME:-fleetsync}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: \${JWT_SECRET:-dev_jwt_secret_change_me}
      ENCRYPTION_KEY: \${ENCRYPTION_KEY:-dev_encryption_key_change_me}
      PORT: 3000
      LOG_LEVEL: \${LOG_LEVEL:-info}
    ports:
      - "\${API_PORT:-3000}:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./api:/app
      - /app/node_modules
    command: npm run start:dev
    restart: unless-stopped
    networks:
      - fleetsync

  worker-1:
    build:
      context: ./workers
      dockerfile: Dockerfile
    container_name: fleetsync-worker-1
    environment:
      NODE_ENV: \${NODE_ENV:-development}
      REDIS_URL: redis://redis:6379
      DATABASE_URL: postgresql://\${DB_USER:-fleetsync}:\${DB_PASSWORD:-dev_password_change_me}@postgres:5432/\${DB_NAME:-fleetsync}
      WORKER_ID: worker-1
      ENCRYPTION_KEY: \${ENCRYPTION_KEY:-dev_encryption_key_change_me}
      LOG_LEVEL: \${LOG_LEVEL:-debug}
    depends_on:
      - redis
      - postgres
    volumes:
      - ./workers:/app
      - /app/node_modules
      - ./workers/screenshots:/app/screenshots
    command: npm run start:dev
    restart: unless-stopped
    networks:
      - fleetsync

  worker-2:
    build:
      context: ./workers
      dockerfile: Dockerfile
    container_name: fleetsync-worker-2
    environment:
      NODE_ENV: \${NODE_ENV:-development}
      REDIS_URL: redis://redis:6379
      DATABASE_URL: postgresql://\${DB_USER:-fleetsync}:\${DB_PASSWORD:-dev_password_change_me}@postgres:5432/\${DB_NAME:-fleetsync}
      WORKER_ID: worker-2
      ENCRYPTION_KEY: \${ENCRYPTION_KEY:-dev_encryption_key_change_me}
      LOG_LEVEL: \${LOG_LEVEL:-debug}
    depends_on:
      - redis
      - postgres
    volumes:
      - ./workers:/app
      - /app/node_modules
      - ./workers/screenshots:/app/screenshots
    command: npm run start:dev
    restart: unless-stopped
    networks:
      - fleetsync

volumes:
  postgres_data:
  redis_data:

networks:
  fleetsync:
    driver: bridge
`,

  // ========== api/Dockerfile ==========
  API_DOCKERFILE: `FROM node:20-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start
CMD ["npm", "run", "start:prod"]
`,

  // ========== workers/Dockerfile ==========
  WORKERS_DOCKERFILE: `FROM mcr.microsoft.com/playwright:v1.40.1-jammy

WORKDIR /app

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

EXPOSE 3001

# Start
CMD ["npm", "run", "start"]
`,

  // ========== .env.example ==========
  ENV_EXAMPLE: `
# ========== ENVIRONMENT ==========

# Node
NODE_ENV=development
LOG_LEVEL=info

# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=fleetsync
DB_PASSWORD=change_me_secure_password_here
DB_NAME=fleetsync

# Redis Queue
REDIS_URL=redis://redis:6379

# JWT & Security
JWT_SECRET=your_random_jwt_secret_here_min_32_chars
JWT_EXPIRATION=24h
ENCRYPTION_KEY=your_32_character_encryption_key_here

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

# Proxy (optional)
PROXY_URL=
PROXY_USERNAME=
PROXY_PASSWORD=

# Monitoring
SENTRY_DSN=
SLACK_WEBHOOK=

# Frontend
FRONTEND_URL=http://localhost:3001

# Kill Switch
KILL_SWITCH_ENABLED=false
KILL_SWITCH_REASON=
  \`,

  // ========== tsconfig.json (API) ==========
  TSCONFIG_API: \`{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
  `
};

export default DOCKER_FILES;