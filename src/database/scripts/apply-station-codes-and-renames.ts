import { DataSource } from 'typeorm';
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
 * Applies the official station codes (from stations_with_codes.xlsx) to the 22
 * active L&O stations and renames three of them. Stations are matched by their
 * current `code` so the script is unambiguous. When a station is renamed, the
 * name-based references in `secretariats.policeStation`,
 * `complaints.policeStation` and `officers.policeStation` are updated to match.
 *
 * Idempotent-ish: after a successful run the old codes no longer exist, so a
 * second run simply reports each entry as "not found (already migrated?)".
 *
 * Run with `--dry-run` to preview without writing.
 */
interface StationMigration {
  oldCode: string;
  newCode: string;
  renameTo?: string;
}

const MIGRATIONS: StationMigration[] = [
  { oldCode: 'VZG-AIR', newCode: '2038072' },
  { oldCode: 'VZG-ANP', newCode: '2038006' },
  { oldCode: 'VZG-ARL', newCode: '2038080' },
  { oldCode: 'VZG-BHM', newCode: '2038009', renameTo: 'Bhimunipatnam' },
  { oldCode: 'VZG-DVD', newCode: '2038075' },
  { oldCode: 'VZG-DWK', newCode: '2038076' },
  { oldCode: 'VZG-GJW', newCode: '2038010' },
  { oldCode: 'VZG-GPL', newCode: '2038018' },
  { oldCode: 'VZG-01', newCode: '2038001' },
  { oldCode: 'VZG-02', newCode: '2038002' },
  { oldCode: 'VZG-03', newCode: '2038003' },
  { oldCode: 'VZG-04', newCode: '2038004' },
  { oldCode: 'VZG-KND', newCode: '2038042' },
  { oldCode: 'VZG-MRP', newCode: '2038091', renameTo: 'Maharanipeta' },
  { oldCode: 'VZG-MLK', newCode: '2038008' },
  { oldCode: 'VZG-MVP', newCode: '2038092', renameTo: 'Muvvalavanipalem' },
  { oldCode: 'VZG-NPT', newCode: '2038014' },
  { oldCode: 'VZG-PDN', newCode: '2038040' },
  { oldCode: 'VZG-PRW', newCode: '2038041' },
  { oldCode: 'VZG-PND', newCode: '2038035' },
  { oldCode: 'VZG-PMD', newCode: '2038017' },
  { oldCode: 'VZG-SBV', newCode: '2035012' },
];

async function applyStationCodesAndRenames() {
  const dryRun = process.argv.includes('--dry-run');

  console.log(
    `🏷️  Applying station codes & renames${dryRun ? ' (dry run)' : ''}...\n`,
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
    const complaintRepo = dataSource.getRepository(Complaint);
    const officerRepo = dataSource.getRepository(Officer);

    let updated = 0;
    let renamed = 0;
    let missing = 0;

    for (const m of MIGRATIONS) {
      const station = await stationRepo.findOne({ where: { code: m.oldCode } });
      if (!station) {
        console.log(`   ⚠️  ${m.oldCode} not found (already migrated?)`);
        missing++;
        continue;
      }

      const willRename = !!m.renameTo && station.name !== m.renameTo;
      const label = willRename
        ? `${station.name} → ${m.renameTo}`
        : station.name;
      console.log(
        `   • ${label}: code ${station.code} → ${m.newCode}${
          willRename ? ' (+ rename references)' : ''
        }`,
      );

      if (dryRun) continue;

      if (willRename) {
        const oldName = station.name;
        await secretariatRepo.update(
          { policeStation: oldName },
          { policeStation: m.renameTo! },
        );
        await complaintRepo.update(
          { policeStation: oldName },
          { policeStation: m.renameTo! },
        );
        await officerRepo.update(
          { policeStation: oldName },
          { policeStation: m.renameTo! },
        );
        renamed++;
      }

      await stationRepo.update(
        { id: station.id },
        { code: m.newCode, name: m.renameTo ?? station.name },
      );
      updated++;
    }

    console.log('');
    if (dryRun) {
      console.log('💡 Dry run — no changes written. Re-run without --dry-run to apply.\n');
    } else {
      console.log(
        `✅ Updated ${updated} station codes, renamed ${renamed}, ${missing} not found.\n`,
      );
    }

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error while applying station codes/renames:', error);
    process.exit(1);
  }
}

applyStationCodesAndRenames();
