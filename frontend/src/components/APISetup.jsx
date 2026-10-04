/**
 * 🔧 FLEETSYNC API - NESTJS COMPLET
 * Code prêt à copier-coller
 */

export const API_CODE = {
  // ========== api/package.json ==========
  PACKAGE_JSON: `{
  "name": "fleetsync-api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "db:migrate": "typeorm migration:run -d dist/database/typeorm.config",
    "db:seed": "ts-node src/database/seeds/seed.ts"
  },
  "dependencies": {
    "@nestjs/common": "^10.2.18",
    "@nestjs/core": "^10.2.18",
    "@nestjs/jwt": "^12.0.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/typeorm": "^9.0.1",
    "@nestjs/bull": "^10.0.1",
    "typeorm": "^0.3.17",
    "postgres": "^3.4.3",
    "passport-jwt": "^4.0.1",
    "bcryptjs": "^2.4.3",
    "bull": "^4.11.4",
    "redis": "^4.6.12",
    "dotenv": "^16.3.1",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "axios": "^1.6.2",
    "googleapis": "^118.0.0",
    "openai": "^4.28.0",
    "pino": "^8.17.2"
  }
}`,

  // ========== api/src/main.ts ==========
  MAIN_TS: `import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(\`✅ API running on http://localhost:\${port}\`);
}

bootstrap();`,

  // ========== api/src/app.module.ts ==========
  APP_MODULE: `import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { AutomationsModule } from './automations/automations.module';
import { KillSwitchModule } from './kill-switch/kill-switch.module';
import { EncryptionModule } from './encryption/encryption.module';
import { typeormConfig } from './database/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeormConfig),
    BullModule.forRoot({
      redis: process.env.REDIS_URL || 'redis://localhost:6379',
    }),
    AuthModule,
    UsersModule,
    VehiclesModule,
    AutomationsModule,
    KillSwitchModule,
    EncryptionModule,
  ],
})
export class AppModule {}`,

  // ========== api/src/database/typeorm.config.ts ==========
  TYPEORM_CONFIG: `import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { VehicleEntity } from '../vehicles/entities/vehicle.entity';
import { BookingEntity } from '../bookings/entities/booking.entity';
import { AutomationEntity } from '../automations/entities/automation.entity';

export const typeormConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'fleetsync',
  password: process.env.DB_PASSWORD || 'dev_password',
  database: process.env.DB_NAME || 'fleetsync',
  entities: [UserEntity, VehicleEntity, BookingEntity, AutomationEntity],
  migrations: ['dist/database/migrations/*.js'],
  migrationsRun: true,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};`,

  // ========== api/src/users/entities/user.entity.ts ==========
  USER_ENTITY: `import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { VehicleEntity } from '../../vehicles/entities/vehicle.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // bcrypted

  @Column()
  fullName: string;

  @Column({ nullable: true })
  companyName: string;

  @Column('json', { nullable: true })
  turoCredentials: { email?: string; sessionCookie?: string } = {};

  @Column('json', { nullable: true })
  getaroundCredentials: { email?: string; sessionCookie?: string } = {};

  @Column({ default: true })
  automationEnabled: boolean;

  @Column({ default: false })
  killSwitchActive: boolean;

  @OneToMany(() => VehicleEntity, (vehicle) => vehicle.user)
  vehicles: VehicleEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}`,

  // ========== api/src/vehicles/entities/vehicle.entity.ts ==========
  VEHICLE_ENTITY: `import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('vehicles')
export class VehicleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  vin: string;

  @Column()
  licensePlate: string;

  @Column('simple-array')
  platforms: string[]; // ['turo', 'getaround']

  @Column({ default: 'available' })
  status: 'available' | 'booked' | 'maintenance';

  @Column({ nullable: true })
  currentBookingId: string;

  @ManyToOne(() => UserEntity, (user) => user.vehicles, { onDelete: 'CASCADE' })
  user: UserEntity;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}`,

  // ========== api/src/automations/automations.service.ts ==========
  AUTOMATIONS_SERVICE: `import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { AutomationEntity } from './entities/automation.entity';
import { UserEntity } from '../users/entities/user.entity';
import { KillSwitchService } from '../kill-switch/kill-switch.service';

@Injectable()
export class AutomationsService {
  constructor(
    @InjectRepository(AutomationEntity)
    private automationRepo: Repository<AutomationEntity>,
    @InjectQueue('automations')
    private automationQueue: Queue,
    private killSwitchService: KillSwitchService,
  ) {}

  async createBlockDatesJob(
    userId: string,
    vehicleId: string,
    platform: 'turo' | 'getaround',
    startDate: Date,
    endDate: Date,
  ) {
    // ✅ SAFE MODE CHECK
    if (await this.killSwitchService.isActive()) {
      throw new BadRequestException('🛑 Kill switch active - automations disabled');
    }

    const automation = this.automationRepo.create({
      userId,
      vehicleId,
      platform,
      type: 'BLOCK_DATES',
      startDate,
      endDate,
      status: 'PENDING',
    });

    await this.automationRepo.save(automation);

    // Queue the job
    await this.automationQueue.add(
      'block-dates',
      {
        automationId: automation.id,
        userId,
        vehicleId,
        platform,
        startDate,
        endDate,
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
    );

    return automation;
  }

  async getAutomationStatus(automationId: string) {
    return this.automationRepo.findOne({ where: { id: automationId } });
  }
}`,

  // ========== api/src/kill-switch/kill-switch.service.ts ==========
  KILL_SWITCH_SERVICE: `import { Injectable } from '@nestjs/common';
import { RedisService } from '../common/redis.service';

@Injectable()
export class KillSwitchService {
  constructor(private redisService: RedisService) {}

  async activate(reason: string) {
    await this.redisService.set('kill-switch', JSON.stringify({
      active: true,
      reason,
      timestamp: new Date(),
    }), 0); // No expiration
    console.log(\`🛑 KILL SWITCH ACTIVATED: \${reason}\`);
  }

  async deactivate() {
    await this.redisService.del('kill-switch');
    console.log('✅ Kill switch deactivated');
  }

  async isActive(): Promise<boolean> {
    const status = await this.redisService.get('kill-switch');
    return status !== null;
  }

  async getReason(): Promise<string | null> {
    const status = await this.redisService.get('kill-switch');
    if (status) {
      const data = JSON.parse(status);
      return data.reason;
    }
    return null;
  }
}`,

  // ========== api/Dockerfile ==========
  DOCKERFILE: `FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]`
};

export default API_CODE;