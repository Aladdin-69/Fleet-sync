/**
 * 📖 FLEETSYNC - DEPLOYMENT GUIDE & ARCHITECTURE
 */

export const DEPLOYMENT_GUIDE = {
  ARCHITECTURE_DIAGRAM: `
┌─────────────────────────────────────────────────────────────────┐
│                    FLEETSYNC CLOUD ARCHITECTURE                 │
└─────────────────────────────────────────────────────────────────┘

                        ┌──────────────────┐
                        │  React Dashboard │
                        │   (Vercel/S3)    │
                        └────────┬─────────┘
                                 │ HTTPS
                        ┌────────▼─────────┐
                        │   NestJS API     │
                        │  (AWS/Scaleway)  │
                        │   Port 3000      │
                        └────────┬─────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
         ┌──────▼──────┐  ┌──────▼──────┐  ┌─────▼──────┐
         │  PostgreSQL │  │    Redis    │  │   S3/Blob  │
         │  (DB)       │  │   (Queue)   │  │  (Logs)    │
         └─────────────┘  └──────┬──────┘  └────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │        Bull Queue Jobs │                        │
        │    (Async Processing)  │                        │
        │                        │                        │
   ┌────▼────┐  ┌────────┐  ┌────▼────┐  ┌────────┐
   │ Worker 1 │  │ Worker 2 │  │ Worker 3 │  │ Worker N │
   │Playwright│  │Playwright│  │Playwright│  │Playwright│
   │ (Turo)   │  │(Getaround)  │ (Hunos)  │  │(Proxy)   │
   └──────────┘  └──────────┘  └────────┘  └────────┘

KEY:
✅ Each worker = Isolated browser instance per client
✅ Redis = Job queue + Kill switch coordination
✅ PostgreSQL = Audit logs + automation history
✅ Workers can be scaled horizontally (k8s)
✅ All actions are logged & traceable
  `,

  INSTALLATION_STEPS: `
📋 FLEETSYNC CLOUD - INSTALLATION COMPLÈTE

PRÉREQUIS
═════════
- Docker & Docker Compose
- Node.js 20+
- PostgreSQL 16+ (ou utiliser docker)
- Redis (ou utiliser docker)
- Compte AWS/Scaleway (pour production)


ÉTAPE 1: SETUP LOCAL
═════════════════════
1. Créer structure:
   mkdir fleetsync-cloud
   cd fleetsync-cloud
   mkdir -p api workers

2. Clone/télécharger le code dans chaque dossier

3. Copier .env:
   cp .env.example .env
   # ⚠️ Changer les secrets !


ÉTAPE 2: LANCER DOCKER
══════════════════════
docker-compose up -d

✅ Services démarrés:
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379
   - API: localhost:3000
   - Workers: En attente de jobs


ÉTAPE 3: MIGRATIONS DB
══════════════════════
docker-compose exec api npm run db:migrate

✅ Tables créées:
   - users
   - vehicles
   - bookings
   - automations
   - automation_logs
   - audit_logs


ÉTAPE 4: VÉRIFIER SANTÉ
═══════════════════════
# Tester API
curl http://localhost:3000/health

# Redis
docker-compose exec redis redis-cli ping
# → PONG

# PostgreSQL
docker-compose exec postgres psql -U fleetsync -d fleetsync -c "SELECT 1;"
# → OK


ÉTAPE 5: PRODUCTION (AWS)
════════════════════════
1. RDS PostgreSQL
   - Multi-AZ enabled
   - Automated backups
   - SSL enabled

2. ElastiCache Redis
   - Multi-AZ
   - Automatic failover

3. ECS Fargate (API)
   - 2 tasks (auto-scaling)
   - Load balancer
   - CloudWatch logs

4. ECS Fargate (Workers)
   - 5-10 tasks (scalable)
   - Spot instances (cheaper)
   - Autoscaling on queue depth

5. S3
   - Logs storage
   - Screenshots backup

6. Secrets Manager
   - DB credentials
   - API keys
   - JWT secret


ÉTAPE 6: CI/CD (GitHub Actions)
════════════════════════════════
Workflow:
  Push code
    ↓
  Run tests
    ↓
  Build Docker images
    ↓
  Push to ECR
    ↓
  Deploy to ECS (staging)
    ↓
  Health check
    ↓
  Deploy to ECS (production)


MONITORING
══════════
DataDog / New Relic:
  - API response times
  - Worker job durations
  - Queue depth
  - Error rates
  - Database performance

Alertes:
  - Queue depth > 1000 → Scale workers
  - API p95 > 2s → Alert
  - Error rate > 5% → Kill switch
  - Worker crash → Auto-restart
  `,

  SECURITY_CHECKLIST: `
🔐 SÉCURITÉ - CHECKLIST PRODUCTION
═════════════════════════════════════

DATABASE
✅ SSL/TLS encryption in transit
✅ Encryption at rest
✅ VPC private subnet
✅ Minimal IAM permissions
✅ Automated backups to S3
✅ Point-in-time recovery
✅ Database user ≠ root

API
✅ HTTPS only
✅ WAF (Web Application Firewall)
✅ Rate limiting (1000 req/min per IP)
✅ CORS restricted
✅ Input validation (class-validator)
✅ No secrets in logs
✅ JWT with expiration (24h)
✅ Refresh token rotation

WORKERS
✅ No direct internet (proxy only)
✅ VPC private subnet
✅ Credentials encrypted with AES-256
✅ Session isolation per client
✅ Screenshots encrypted before storage
✅ Automatic cleanup on task complete
✅ Timeout protection (5min max)
✅ Memory limits (512MB)

SECRETS MANAGEMENT
✅ AWS Secrets Manager / Vault
✅ Rotation every 90 days
✅ No secrets in code
✅ No secrets in logs
✅ Access logged

AUDIT & LOGS
✅ All actions logged
✅ Immutable audit trail
✅ Logs encrypted in S3
✅ Retention: 1 year
✅ PII masked
✅ GDPR compliant

KILL SWITCH
✅ Accessible to admin only
✅ Logged in audit trail
✅ Immediate effect (all workers stop)
✅ Can be triggered automatically
✅ Requires confirmation for reactivation
  `,

  COST_ESTIMATION: `
💰 ESTIMATION DE COÛTS MENSUELS (AWS)
═════════════════════════════════════

TIER 1: Startup (10 clients)
─────────────────────────────
  API (t4g.micro): $10
  Workers (1 on-demand): $25
  RDS (t4g.micro): $50
  ElastiCache (cache.t4g.micro): $20
  S3 (storage): $5
  DataDog: $15
  ─────────────
  TOTAL: ~$125/mois


TIER 2: Growth (100 clients)
──────────────────────────────
  API (t4g.small, 2 instances): $60
  Workers (3 on-demand + spot): $200
  RDS (t4g.small): $150
  ElastiCache (cache.t4g.small): $60
  S3 + CloudFront: $50
  DataDog: $50
  ─────────────
  TOTAL: ~$570/mois


TIER 3: Scale (1000 clients)
──────────────────────────────
  API (m7g.medium, 3 instances): $300
  Workers (10 on-demand + spot): $1500
  RDS (r6g.large, Multi-AZ): $800
  ElastiCache (cache.r6g.large): $400
  S3 + CloudFront: $300
  DataDog: $200
  ─────────────
  TOTAL: ~$3500/mois


💡 OPTIMISATIONS
  - Spot instances (70% saving)
  - Reserved instances (40% saving)
  - Auto-scaling (pay only what you use)
  - Cache optimization
  - Log compression
  `,

  SCALING_STRATEGY: `
📈 STRATÉGIE DE SCALING
═══════════════════════

HORIZONTAL SCALING (Workers)
─────────────────────────────
Métrique: Queue depth (nombre de jobs en attente)

  Queue depth | Action
  ────────────┼──────────────────────────
  < 100       | 3 workers
  100-500     | 5 workers (scale up)
  500-1000    | 10 workers
  > 1000      | 20 workers + alert

Implémentation:
  - AWS ECS Auto Scaling Group
  - Target: Queue depth / Worker = 5 jobs max
  - Scale up time: 2 minutes
  - Scale down time: 10 minutes


VERTICAL SCALING (API/Workers)
───────────────────────────────
  Métrique: CPU > 80% ou Memory > 90%

  Action:
    - Upgrade instance size
    - Add more instances (horizontal preferred)
    - Cache optimization


DATABASE SCALING
────────────────
  Métrique: Connections > 80% of max

  Action:
    - Connection pooling (PgBouncer)
    - Read replicas for reporting
    - Upgrade instance size
    - Query optimization


QUEUE OPTIMIZATION
───────────────────
  - Batch processing (combine jobs)
  - Priority queues (urgent jobs first)
  - Job deduplication
  - Compression of payloads


EXAMPLE: 1000 → 10000 clients
──────────────────────────────
  1. Increase workers: 10 → 50
  2. Upgrade RDS: t4g.small → r6g.large
  3. API replicas: 2 → 5
  4. ElastiCache: cache.t4g.small → cache.r6g.large
  5. Multi-region (optional): EU + US
  `,

  TROUBLESHOOTING: `
🐛 TROUBLESHOOTING COURANT
═══════════════════════════

PROBLÈME: Workers crash
───────────────────────
Logs:
  Error: Timeout waiting for browser launch

Cause: Playwright initialization failing
Solution:
  - Increase timeout: 30s → 60s
  - Check disk space
  - Check memory limits
  - Restart worker


PROBLÈME: Job queue accumulating
─────────────────────────────────
Logs:
  Queue depth: 5000 jobs pending

Cause: Workers slower than job creation
Solution:
  - Scale up workers (immediately)
  - Check job duration
  - Optimize Playwright selectors
  - Check network latency


PROBLÈME: PostgreSQL connection errors
──────────────────────────────────────
Logs:
  Error: ECONNREFUSED 127.0.0.1:5432

Cause: DB down or connection pool exhausted
Solution:
  - Check DB health: \`docker-compose logs postgres\`
  - Restart DB: \`docker-compose restart postgres\`
  - Check connection pool: \`SELECT count(*) FROM pg_stat_activity\`
  - Increase pool size


PROBLÈME: Kill switch not activating
────────────────────────────────────
Logs:
  Kill switch enabled but workers still running

Cause: Workers not checking Redis
Solution:
  - Verify Redis connectivity
  - Check worker restart policy
  - Manual kill: \`docker-compose stop workers\`
  `,

  NEXT_STEPS: `
🎯 PROCHAINES ÉTAPES
═════════════════════

Phase 1: Foundation (Week 1-2)
  ✅ Local setup with docker-compose
  ✅ Basic API endpoints
  ✅ Worker job processing
  ✅ Kill switch implementation

Phase 2: Production (Week 3-4)
  ✅ AWS infrastructure
  ✅ Database migrations
  ✅ CI/CD pipeline
  ✅ Monitoring & logging

Phase 3: Scaling (Week 5-6)
  ✅ Auto-scaling groups
  ✅ Load balancing
  ✅ Cache optimization
  ✅ Multi-region (optional)

Phase 4: Features (Week 7+)
  ✅ Advanced monitoring
  ✅ Machine learning (anomaly detection)
  ✅ Client dashboards
  ✅ API webhooks
  `
};

export default DEPLOYMENT_GUIDE;