import { join } from 'path';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Complaint } from '../complaints/entities/complaint.entity';
import { ComplaintLog } from '../complaints/entities/complaint-log.entity';
import { KioskSequence } from '../complaints/entities/kiosk-sequence.entity';
import { PoliceStation } from '../police-stations/entities/police-station.entity';
import { Officer } from '../officers/entities/officer.entity';
import { Secretariat } from '../secretariats/entities/secretariat.entity';
import { ExternalCallLog } from '../external-call-logs/entities/external-call-log.entity';

// Load environment variables (same convention as the seed script)
config({ path: '.env.local' });
config({ path: '.env' });

/**
 * TypeORM DataSource used by the TypeORM CLI for migrations.
 * `synchronize` is intentionally OFF here — schema changes go through migrations.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'complaints',
  entities: [
    Complaint,
    ComplaintLog,
    KioskSequence,
    PoliceStation,
    Officer,
    Secretariat,
    ExternalCallLog,
  ],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
  logging: false,
  ssl:
    process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

export default AppDataSource;
