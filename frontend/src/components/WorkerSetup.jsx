/**
 * 🤖 FLEETSYNC WORKERS - PLAYWRIGHT AUTOMATION
 * Code prêt à copier-coller
 */

export const WORKER_CODE = {
  // ========== workers/package.json ==========
  PACKAGE_JSON: `{
  "name": "fleetsync-workers",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node dist/main.js",
    "start:dev": "ts-node src/main.ts",
    "build": "tsc"
  },
  "dependencies": {
    "playwright": "^1.40.1",
    "bull": "^4.11.4",
    "redis": "^4.6.12",
    "typeorm": "^0.3.17",
    "postgres": "^3.4.3",
    "dotenv": "^16.3.1",
    "pino": "^8.17.2",
    "axios": "^1.6.2"
  }
}`,

  // ========== workers/src/main.ts ==========
  MAIN_TS: `import Queue from 'bull';
import { BrowserPool } from './browser/browser.pool';
import { SessionManager } from './browser/session.manager';
import { TuroAgent } from './platforms/turo.agent';
import { GetaroundAgent } from './platforms/getaround.agent';
import { Logger } from 'pino';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const automationQueue = new Queue('automations', process.env.REDIS_URL || 'redis://localhost:6379');
const browserPool = new BrowserPool(logger);
const sessionManager = new SessionManager(logger);

// ========== BLOCK_DATES JOB ==========
automationQueue.process('block-dates', 3, async (job) => {
  const { automationId, userId, vehicleId, platform, startDate, endDate } = job.data;

  logger.info(\`📌 Starting BLOCK_DATES job: \${automationId}\`);

  try {
    // Get user credentials from database
    const userCredentials = await sessionManager.getUserCredentials(userId, platform);
    
    // Get browser instance (isolated per client)
    const browser = await browserPool.getBrowser(userId);
    const page = await browser.newPage();

    let agent;
    if (platform === 'turo') {
      agent = new TuroAgent(page, logger);
    } else if (platform === 'getaround') {
      agent = new GetaroundAgent(page, logger);
    } else {
      throw new Error(\`Unknown platform: \${platform}\`);
    }

    // Connect & authenticate
    await agent.authenticate(userCredentials.email, userCredentials.password);

    // Find vehicle & block dates
    await agent.findVehicleViaDashboard(vehicleId);
    await agent.blockDates(startDate, endDate);

    // Save session
    const cookies = await page.context().cookies();
    await sessionManager.saveSession(userId, platform, cookies);

    await page.close();

    logger.info(\`✅ BLOCK_DATES completed: \${automationId}\`);
    return { success: true, automationId };

  } catch (error) {
    logger.error(\`❌ BLOCK_DATES failed: \${error.message}\`);
    throw error; // Bull will handle retry
  }
});

// ========== CONNECT_PLATFORM JOB ==========
automationQueue.process('connect-platform', 1, async (job) => {
  const { userId, platform, email, password } = job.data;

  logger.info(\`🔗 Connecting platform: \${platform} for user \${userId}\`);

  try {
    const browser = await browserPool.getBrowser(userId);
    const page = await browser.newPage();

    let agent;
    if (platform === 'turo') {
      agent = new TuroAgent(page, logger);
    } else if (platform === 'getaround') {
      agent = new GetaroundAgent(page, logger);
    }

    const result = await agent.testConnection(email, password);

    const cookies = await page.context().cookies();
    await sessionManager.saveSession(userId, platform, cookies);
    await page.close();

    logger.info(\`✅ Connected to \${platform}\`);
    return { success: true, platform };

  } catch (error) {
    logger.error(\`❌ Connection failed: \${error.message}\`);
    throw error;
  }
});

// ========== DISABLE_AUTOMATION JOB ==========
automationQueue.process('disable-automation', 1, async (job) => {
  const { userId, reason } = job.data;

  logger.warn(\`🛑 DISABLING automation for user \${userId}: \${reason}\`);

  const browser = await browserPool.getBrowser(userId);
  await browser.close();
  browserPool.releaseUser(userId);

  return { success: true, disabled: true };
});

// Global error handler
automationQueue.on('failed', (job, err) => {
  logger.error(\`Job failed: \${job.id} - \${err.message}\`);
});

logger.info(\`🤖 Worker \${process.env.WORKER_ID} started and listening...\`);`,

  // ========== workers/src/browser/browser.pool.ts ==========
  BROWSER_POOL: `import { Browser, BrowserContext, chromium } from 'playwright';
import { Logger } from 'pino';
import { StealthPlugin } from './stealth';

export class BrowserPool {
  private browsers: Map<string, Browser> = new Map();
  private contexts: Map<string, BrowserContext> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  // ✅ Isolated browser per client
  async getBrowser(userId: string): Promise<Browser> {
    if (this.browsers.has(userId)) {
      return this.browsers.get(userId)!;
    }

    this.logger.info(\`🌐 Creating browser for user \${userId}\`);

    const browser = await chromium.launch({
      headless: true,
      // Optional: Use proxy for IP rotation
      proxy: this.getProxyForUser(userId),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    // Apply stealth plugin to avoid detection
    const context = await browser.newContext();
    await StealthPlugin.apply(context);

    this.browsers.set(userId, browser);
    this.contexts.set(userId, context);

    return browser;
  }

  async releaseBrowser(userId: string) {
    const browser = this.browsers.get(userId);
    const context = this.contexts.get(userId);

    if (context) await context.close();
    if (browser) await browser.close();

    this.browsers.delete(userId);
    this.contexts.delete(userId);

    this.logger.info(\`🗑️ Released browser for \${userId}\`);
  }

  private getProxyForUser(userId: string) {
    // Implement proxy rotation logic
    // Each user gets a unique IP
    return {
      server: process.env.PROXY_URL || 'http://proxy:8080',
    };
  }
}`,

  // ========== workers/src/platforms/turo.agent.ts ==========
  TURO_AGENT: `import { Page } from 'playwright';
import { Logger } from 'pino';

export class TuroAgent {
  constructor(private page: Page, private logger: Logger) {}

  async authenticate(email: string, password: string) {
    this.logger.info('🔐 Authenticating on Turo...');

    await this.page.goto('https://turo.com/fr/fr/login', { waitUntil: 'networkidle' });

    // Click on "Continuer avec l'adresse e-mail"
    await this.page.locator('button[type="button"]').first().click();
    await this.page.waitForTimeout(1000);

    // Fill email
    await this.page.fill('input[type="email"]', email);
    await this.page.click('button[type="submit"]');
    await this.page.waitForTimeout(2000);

    // Here will password input field appear or passcode(2fa) input field appear
    // if passcode input field appear then fail to authenticate
    if (await this.page.locator('input[name="passcode"]').isVisible()) {
      throw new Error('Passcode(2fa) input field appear, fail to authenticate');
    }

    // Fill password
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');

    // Wait for redirect
    await this.page.waitForURL('https://turo.com/fr/fr/vehicles/listings/**', { timeout: 10000 });

    this.logger.info('✅ Authenticated on Turo');
  }

  async findVehicleById(externalId: string) {
    this.logger.info(\`🚗 Searching for vehicle with Turo ID: \${externalId}\`);

    // Option 1: Direct navigation (faster)
    try {
      await this.page.goto(\`https://turo.com/vehicles/\${externalId}\`, {
        waitUntil: 'networkidle',
        timeout: 15000
      });

      // Verify we're on the vehicle page
      const isVehiclePage = await this.page.locator('[data-test="vehicle-calendar"]').isVisible({ timeout: 5000 });

      if (!isVehiclePage) {
        throw new Error('Not on vehicle page after navigation');
      }

      this.logger.info(\`✅ Vehicle \${externalId} found\`);
      return true;

    } catch (error) {
      // Option 2: Fallback via dashboard (slower but more robust)
      this.logger.warn('⚠️ Direct navigation failed, trying via dashboard...');
      return await this.findVehicleViaDashboard(externalId);
    }
  }

  async findVehicleViaDashboard(externalId: string) {
    await this.page.goto('https://turo.com/fr/fr/vehicles/listings', { waitUntil: 'networkidle' });

    // Search for vehicle in list
    const vehicleCards = this.page.locator('[data-testid="vehicle-listing-details-card"]');
    const count = await vehicleCards.count();

    for (let i = 0; i < count; i++) {
      const card = vehicleCards.nth(i);
      const href = await card.locator('a').first().getAttribute('href');

      if (href && href.includes(\`/\${externalId}\`)) {
        await card.click();
        await this.page.waitForURL(\`**/your-car/\${externalId}**\`);
        this.logger.info(\`✅ Vehicle \${externalId} found via dashboard\`);
        return true;
      }
    }

    throw new Error(\`Vehicle \${externalId} not found in dashboard\`);
  }

  async getAllVehicles(): Promise<TuroVehicle[]> {
    this.logger.info('📋 Retrieving all vehicles from Turo...');

    await this.page.goto('https://turo.com/fr/fr/vehicles/listings', { waitUntil: 'networkidle' });

    const vehicleCards = await this.page.locator('[data-testid="vehicle-listing-details-card"]').all();
    const vehicles: TuroVehicle[] = [];

    for (const card of vehicleCards) {
      try {
        // 1️⃣ Extract ID from link
        const link = await card.locator('a').first();
        const href = await link.getAttribute('href');

        if (!href) continue;

        const idMatch = href.match(/\/your-car\/(\d+)/);
        if (!idMatch) continue;

        const externalId = idMatch[1];

        // 2️⃣ Extract LICENSE PLATE
        // HTML format: <p class="css-1u90aiw-StyledText-VehicleDetailsCard" title="CW709HB">
        let licensePlate = '';

        try {
          // Method 1: Via title attribute (most reliable)
          const elementWithTitle = card.locator('p[title][class*="StyledText-VehicleDetailsCard"]');
          licensePlate = await elementWithTitle.getAttribute('title').catch(() => '');

          // Method 2 (fallback): Search in visible text
          if (!licensePlate) {
            const cardTexts = await card.locator('p').allTextContents();
            // License plate is often the first short text (format: 2-10 alphanumeric characters)
            for (const text of cardTexts) {
              const cleanText = text.trim().toUpperCase();
              // License plate format: letters and numbers only, 2-10 characters
              if (/^[A-Z0-9]{2,10}$/.test(cleanText) && !cleanText.includes('HTTP')) {
                licensePlate = cleanText;
                break;
              }
            }
          }

          // Method 3 (last resort): Search any text with title
          if (!licensePlate) {
            const allTitleElements = await card.locator('[title]').all();
            for (const element of allTitleElements) {
              const titleValue = await element.getAttribute('title');
              if (titleValue && /^[A-Z0-9]{2,10}$/.test(titleValue.trim().toUpperCase())) {
                licensePlate = titleValue.trim().toUpperCase();
                break;
              }
            }
          }

        } catch (error) {
          this.logger.warn(\`⚠️ Error extracting license plate for vehicle \${externalId}: \${error.message}\`);
        }

        // If no license plate found, use fallback
        if (!licensePlate) {
          this.logger.warn(\`⚠️ License plate not found for vehicle \${externalId}, using ID as fallback\`);
          licensePlate = \`TURO_\${externalId}\`;
        }

        vehicles.push({ externalId, licensePlate });
        this.logger.info(\`  ✓ Vehicle \${externalId}: \${licensePlate}\`);

      } catch (error) {
        this.logger.error(\`❌ Error extracting vehicle: \${error.message}\`);
      }
    }

    this.logger.info(\`✅ \${vehicles.length} vehicles retrieved with license plates\`);
    return vehicles;
  }

  async getAllVehicleIds(): Promise<string[]> {
    const vehicles = await this.getAllVehicles();
    return vehicles.map(v => v.externalId);
  }

  async blockDates(startDate: Date, endDate: Date) {
    this.logger.info(\`📅 Blocking dates: \${startDate} to \${endDate}\`);

    // Navigate to calendar
    await this.page.click('text=Unavailable');

    // Select date range
    // (Implementation depends on Turo's UI)
    await this.page.fill('input[aria-label="Start date"]', startDate.toISOString().split('T')[0]);
    await this.page.fill('input[aria-label="End date"]', endDate.toISOString().split('T')[0]);

    await this.page.click('button:has-text("Save")');
    await this.page.waitForTimeout(2000);

    this.logger.info('✅ Dates blocked successfully');
  }

  async testConnection(email: string, password: string): Promise<boolean> {
    try {
      await this.authenticate(email, password);
      return true;
    } catch (error) {
      this.logger.error(\`❌ Turo connection failed: \${error.message}\`);
      return false;
    }
  }
}`,

  // ========== workers/src/platforms/getaround.agent.ts ==========
  GETAROUND_AGENT: `import { Page } from 'playwright';
import { Logger } from 'pino';

export class GetaroundAgent {
  constructor(private page: Page, private logger: Logger) {}

  async authenticate(email: string, password: string) {
    this.logger.info('🔐 Authenticating on Getaround...');

    await this.page.goto('https://getaround.com/email', { waitUntil: 'networkidle' });

    await this.page.fill('input[type="email"]', email);
    await this.page.click('button[type="submit"]');
    await this.page.waitForTimeout(1000);

    await this.page.locator('input[type="password"]').waitFor({ state: 'visible', timeout: 10000 });
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForTimeout(5000);

    await this.page.goto('https://getaround.com/dashboard/cars', { waitUntil: 'networkidle' });
    await this.page.waitForURL('https://getaround.com/dashboard/**');

    this.logger.info('✅ Authenticated on Getaround');
  }

  async findVehicleById(externalId: string) {
    this.logger.info(\`🚗 Searching for vehicle with Getaround ID: \${externalId}\`);

    // Direct navigation to vehicle
    try {
      await this.page.goto(\`https://getaround.com/cars/\${externalId}\`, {
        waitUntil: 'networkidle',
        timeout: 15000
      });

      // Verify we're on the vehicle page
      const isVehiclePage = await this.page.locator('[data-test="vehicle-details"]').isVisible({ timeout: 5000 });

      if (!isVehiclePage) {
        throw new Error('Not on vehicle page after navigation');
      }

      this.logger.info(\`✅ Vehicle \${externalId} found\`);
      return true;

    } catch (error) {
      // Fallback via dashboard
      this.logger.warn(\`⚠️ Direct navigation failed, trying via dashboard...\`);
      return await this.findVehicleViaDashboard(externalId);
    }
  }

  async findVehicleViaDashboard(externalId: string) {
    await this.page.goto(\`https://getaround.com/dashboard/cars/\${externalId}\`, { waitUntil: 'networkidle' });

    // Verify we're on the vehicle page
    const isVehiclePage = await this.page.locator('.dashboard_car_home_header').isVisible({ timeout: 5000 });

    if (!isVehiclePage) {
      throw new Error(\`Vehicle \${externalId} not found in dashboard\`);
    }

    this.logger.info(\`✅ Vehicle \${externalId} found\`);
    return true;
  }

  async getAllVehicles(): Promise<GetaroundVehicle[]> {
    this.logger.info('📋 Retrieving all vehicles from Getaround...');

    await this.page.goto('https://getaround.com/dashboard/cars', { waitUntil: 'networkidle' });

    const vehicleCards = await this.page.locator('.car-row').all();
    const vehicles: GetaroundVehicle[] = [];

    for (const card of vehicleCards) {
      try {
        // 1️⃣ Extract vehicle ID
        const href = await card.locator('a').first().getAttribute('href');
        if (!href) continue;

        const externalId = href.split('/').pop();
        if (!externalId) continue;

        // 2️⃣ Extract license plate
        let licensePlate = '';

        try {
          // Search in title or data-plate attributes
          licensePlate = await card.locator('[data-plate]').getAttribute('data-plate').catch(() => '');

          if (!licensePlate) {
            licensePlate = await card.locator('[title]').first().getAttribute('title').catch(() => '');
          }

          const elementPlateNumber = card.locator('[class*="plate-number"]');
          if (elementPlateNumber) {
            licensePlate = await elementPlateNumber.textContent().catch(() => '');
          }

          // Search in text if not found
          if (!licensePlate) {
            const cardTexts = await card.locator('p, span, div').allTextContents();
            for (const text of cardTexts) {
              const cleanText = text.trim().toUpperCase();
              if (/^[A-Z0-9]{2,10}$/.test(cleanText) && !cleanText.includes('HTTP')) {
                licensePlate = cleanText;
                break;
              }
            }
          }

        } catch (error) {
          this.logger.warn(\`⚠️ Error extracting license plate for vehicle \${externalId}: \${error.message}\`);
        }

        // Fallback if no license plate found
        if (!licensePlate) {
          this.logger.warn(\`⚠️ License plate not found for vehicle \${externalId}\`);
          licensePlate = \`GETAROUND_\${externalId}\`;
        }

        vehicles.push({ externalId, licensePlate });
        this.logger.info(\`  ✓ Vehicle \${externalId}: \${licensePlate}\`);

      } catch (error) {
        this.logger.error(\`❌ Error extracting vehicle: \${error.message}\`);
      }
    }

    this.logger.info(\`✅ \${vehicles.length} vehicles retrieved with license plates\`);
    return vehicles;
  }

  async getAllVehicleIds(): Promise<string[]> {
    const vehicles = await this.getAllVehicles();
    return vehicles.map(v => v.externalId);
  }

  async blockDates(startDate: Date, endDate: Date) {
    this.logger.info(\`📅 Blocking dates: \${startDate} to \${endDate}\`);

    await this.page.goto(\`https://getaround.com/dashboard/cars/\${externalId}/calendar\`, { waitUntil: 'networkidle' });

    // Interact with calendar
    await this.page.click('.add-event-button');

    await this.page.locator('.input-trigger').nth(0).click();
    await this.page.locator(\`[data-day="\${startDate.toISOString().split('T')[0]}"]\`).click();
    // await this.page.locator(\`[data-time="00:00"]\`).click();
    await this.page.locator('.time:not(.disabled)').first().click();

    await this.page.locator('.input-trigger').nth(2).click();
    await this.page.locator(\`[data-day="\${endDate.toISOString().split('T')[0]}"]\`).click();
    // await this.page.locator(\`[data-time="23:30"]\`).click();
    await this.page.locator('.time:not(.disabled)').last().click();

    await this.page.getByRole('button', { name: 'Save' }).click();
    // await this.page.locator('button:has-text("Save")').click();
    await this.page.waitForTimeout(2000);

    this.logger.info('✅ Dates blocked successfully');
  }

  async testConnection(email: string, password: string): Promise<boolean> {
    try {
      await this.authenticate(email, password);
      return true;
    } catch (error) {
      this.logger.error(\`❌ Getaround connection failed: \${error.message}\`);
      return false;
    }
  }
}`,

  // ========== workers/src/browser/stealth.ts ==========
  STEALTH_PLUGIN: `import { BrowserContext } from 'playwright';

export class StealthPlugin {
  static async apply(context: BrowserContext) {
    // Override navigator.webdriver
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });

    // Override chrome detection
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'chrome', {
        get: () => ({ runtime: {} }),
      });
    });

    // Set realistic user agent
    // (Already handled by BrowserContext)
  }
}`,

  // ========== workers/Dockerfile ==========
  DOCKERFILE: `FROM mcr.microsoft.com/playwright:v1.40.1-jammy

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start"]`
};

export default WORKER_CODE;