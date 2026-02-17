import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { PoliceStation } from '../../police-stations/entities/police-station.entity';
import { Complaint } from '../../complaints/entities/complaint.entity';
import { ComplaintLog } from '../../complaints/entities/complaint-log.entity';
import { Officer } from '../../officers/entities/officer.entity';
import { policeStationsSeedData } from './police-stations.seed';
import { officersSeedData } from './officers.seed';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env' });

async function seed() {
  console.log('🌱 Starting database seeding...\n');

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'complaints',
    entities: [PoliceStation, Complaint, ComplaintLog, Officer],
    synchronize: true,
    ssl:
      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    const policeStationRepo = dataSource.getRepository(PoliceStation);
    const officerRepo = dataSource.getRepository(Officer);

    const forceFlag = process.argv.includes('--force');

    // Check if data already exists
    const existingStations = await policeStationRepo.count();
    const existingOfficers = await officerRepo.count();

    if ((existingStations > 0 || existingOfficers > 0) && !forceFlag) {
      console.log(
        `ℹ️  Found ${existingStations} police stations, ${existingOfficers} officers.`,
      );
      console.log(
        '   Use --force flag to clear and re-seed: npm run seed -- --force\n',
      );
      await dataSource.destroy();
      return;
    }

    if (forceFlag && (existingStations > 0 || existingOfficers > 0)) {
      console.log('🗑️  Force flag detected. Clearing existing data...');
      await officerRepo.clear();
      await policeStationRepo.clear();
      console.log('✅ Existing data cleared\n');
    }

    // Insert police stations
    console.log('📍 Seeding police stations...');
    const policeStations = policeStationRepo.create(policeStationsSeedData);
    await policeStationRepo.save(policeStations);
    console.log(`✅ Inserted ${policeStations.length} police stations\n`);

    // Insert officers
    console.log('👮 Seeding officers...');
    const officers = officerRepo.create(officersSeedData);
    await officerRepo.save(officers);
    console.log(`✅ Inserted ${officers.length} officers\n`);

    // Summary
    console.log('='.repeat(50));
    console.log('📊 Seeding Summary:');
    console.log(`   - Police Stations: ${policeStations.length}`);
    console.log(`   - Officers: ${officers.length}`);
    console.log('='.repeat(50));
    console.log('\n🎉 Database seeding completed successfully!\n');

    // Print officer login credentials
    console.log('🔐 Officer Login Credentials (username:password):');
    console.log('-'.repeat(50));
    officersSeedData.forEach((o) => {
      console.log(`   ${o.name}: ${o.username}:${o.password}`);
    });
    console.log('');

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seed();
