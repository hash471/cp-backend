import { DataSource, In, Not } from 'typeorm';
import { config } from 'dotenv';
import { PoliceStation } from '../../police-stations/entities/police-station.entity';
import { Complaint } from '../../complaints/entities/complaint.entity';
import { ComplaintLog } from '../../complaints/entities/complaint-log.entity';
import { Officer } from '../../officers/entities/officer.entity';
import { Secretariat } from '../../secretariats/entities/secretariat.entity';

// Load environment variables (same convention as the seed script)
config({ path: '.env.local' });
config({ path: '.env' });

/**
 * Keeps ONLY the required set of police stations active and deactivates every
 * other station. The names below are the canonical values stored in
 * `police_stations.name`. Two still differ from their common/display names:
 *   Dwaraka          -> Dwaraka Nagar
 *   Kancharapalem PS -> Kancharapalem
 *
 * Run with `--dry-run` to preview without writing.
 */
const REQUIRED_STATION_NAMES = [
  'Airport',
  'Anandapuram',
  'Arilova',
  'Bhimunipatnam',
  'Duvvada',
  'Dwaraka Nagar', // Dwaraka
  'Gajuwaka',
  'Gopalapatnam',
  'I Town',
  'II Town',
  'III Town',
  'IV Town',
  'Kancharapalem', // Kancharapalem PS
  'Maharanipeta',
  'Malkapuram',
  'Muvvalavanipalem',
  'New Port',
  'Padmanabham',
  'Parawada',
  'Pendurthy',
  'PM Palem',
  'Sabbavaram',
];

async function activateRequiredStations() {
  const dryRun = process.argv.includes('--dry-run');

  console.log(
    `🚔 Activating only the required police stations${
      dryRun ? ' (dry run)' : ''
    }...\n`,
  );

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'complaints',
    entities: [PoliceStation, Complaint, ComplaintLog, Officer, Secretariat],
    synchronize: true,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    const stationRepo = dataSource.getRepository(PoliceStation);
    const secretariatRepo = dataSource.getRepository(Secretariat);

    const stations = await stationRepo.find();
    const requiredSet = new Set(
      REQUIRED_STATION_NAMES.map((n) => n.toLowerCase()),
    );

    // Warn about any required name that has no matching station in the DB.
    const presentNames = new Set(stations.map((s) => s.name.toLowerCase()));
    const missing = REQUIRED_STATION_NAMES.filter(
      (n) => !presentNames.has(n.toLowerCase()),
    );
    if (missing.length > 0) {
      console.log('⚠️  Required stations NOT found in DB (check the name mapping):');
      missing.forEach((n) => console.log(`   - ${n}`));
      console.log('');
    }

    const toKeep = stations.filter((s) => requiredSet.has(s.name.toLowerCase()));
    const toDeactivate = stations.filter(
      (s) => !requiredSet.has(s.name.toLowerCase()) && s.isActive,
    );

    console.log(`📊 Total stations in DB: ${stations.length}`);
    console.log(`📊 Required (will be active): ${toKeep.length}`);
    console.log(`📊 Active stations to deactivate: ${toDeactivate.length}\n`);

    console.log('The following stations will be DEACTIVATED:');
    toDeactivate.forEach((s) => console.log(`   - ${s.name} (${s.code})`));
    console.log('');

    // Report secretariat coverage for the required stations.
    const secretariats = await secretariatRepo.find({ select: ['policeStation'] });
    const requiredWithSecretariats = new Set(
      secretariats
        .map((s) => s.policeStation?.trim().toLowerCase())
        .filter((n): n is string => !!n && requiredSet.has(n)),
    );
    const requiredWithout = toKeep.filter(
      (s) => !requiredWithSecretariats.has(s.name.toLowerCase()),
    );
    if (requiredWithout.length > 0) {
      console.log(
        'ℹ️  Required stations that currently have NO secretariat (kept active anyway):',
      );
      requiredWithout.forEach((s) => console.log(`   - ${s.name} (${s.code})`));
      console.log('');
    }

    if (dryRun) {
      console.log('💡 Dry run — no changes written. Re-run without --dry-run to apply.\n');
      await dataSource.destroy();
      return;
    }

    // Activate required, deactivate the rest.
    const requiredNames = toKeep.map((s) => s.name);
    if (requiredNames.length > 0) {
      await stationRepo.update({ name: In(requiredNames) }, { isActive: true });
      await stationRepo.update(
        { name: Not(In(requiredNames)) },
        { isActive: false },
      );
    }

    console.log(
      `✅ ${toKeep.length} stations active, ${
        stations.length - toKeep.length
      } stations inactive.\n`,
    );

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error while activating required stations:', error);
    process.exit(1);
  }
}

activateRequiredStations();
