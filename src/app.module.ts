import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { PoliceStationsModule } from './police-stations/police-stations.module';
import { HealthModule } from './health/health.module';
import { Complaint } from './complaints/entities/complaint.entity';
import { ComplaintLog } from './complaints/entities/complaint-log.entity';
import { PoliceStation } from './police-stations/entities/police-station.entity';
import { KioskSequence } from './complaints/entities/kiosk-sequence.entity';
import { Officer } from './officers/entities/officer.entity';
import { OfficersModule } from './officers/officers.module';
import { Secretariat } from './secretariats/entities/secretariat.entity';
import { SecretariatsModule } from './secretariats/secretariats.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'complaints'),
        entities: [Complaint, ComplaintLog, KioskSequence, PoliceStation, Officer, Secretariat],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
        ssl:
          configService.get<string>('DB_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),
    AuthModule,
    ComplaintsModule,
    PoliceStationsModule,
    HealthModule,
    OfficersModule,
    SecretariatsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
