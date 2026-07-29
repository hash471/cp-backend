import { DataSource, In } from 'typeorm';
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
 * Marks police stations as inactive when they have no secretariat attached.
 *
 * A secretariat is "attached" to a station when `secretariats.policeStation`
 * matches `police_stations.name` (the same name-based link used across the
 * codebase). Matching is case-insensitive and trims surrounding whitespace so
 * that minor data-entry differences still count as a match.
 *
 * Run with `--dry-run` to preview the changes without writing them.
 */
async function deactivateStationsWithoutSecretariats() {
  const dryRun = process.argv.includes('--dry-run');

  console.log(
    `🚔 Deactivating police stations with no attached secretariat${
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
    const secretariats = await secretariatRepo.find({ select: ['policeStation'] });

    // Set of normalized station names that have at least one secretariat.
    const stationsWithSecretariat = new Set(
      secretariats
        .map((s) => s.policeStation?.trim().toLowerCase())
        .filter((name): name is string => !!name),
    );

    const toDeactivate = stations.filter(
      (station) =>
        station.isActive &&
        !stationsWithSecretariat.has(station.name.trim().toLowerCase()),
    );

    console.log(`📊 Total police stations: ${stations.length}`);
    console.log(
      `📊 Stations with at least one secretariat: ${stationsWithSecretariat.size}`,
    );
    console.log(
      `📊 Active stations to deactivate (no secretariat): ${toDeactivate.length}\n`,
    );

    if (toDeactivate.length === 0) {
      console.log('✨ Nothing to do — every active station has a secretariat.\n');
      await dataSource.destroy();
      return;
    }

    console.log('The following stations will be marked inactive:');
    toDeactivate.forEach((s) => console.log(`   - ${s.name} (${s.code})`));
    console.log('');

    if (dryRun) {
      console.log('💡 Dry run — no changes written. Re-run without --dry-run to apply.\n');
      await dataSource.destroy();
      return;
    }

    const ids = toDeactivate.map((s) => s.id);
    await stationRepo.update({ id: In(ids) }, { isActive: false });

    console.log(`✅ Deactivated ${toDeactivate.length} police stations.\n`);

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error while deactivating stations:', error);
    process.exit(1);
  }
}

deactivateStationsWithoutSecretariats();
