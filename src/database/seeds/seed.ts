import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { PoliceStation } from '../../police-stations/entities/police-station.entity';
import { Complaint } from '../../complaints/entities/complaint.entity';
import { ComplaintLog } from '../../complaints/entities/complaint-log.entity';
import { policeStationsSeedData } from './police-stations.seed';

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
    entities: [PoliceStation, Complaint, ComplaintLog],
    synchronize: true,
    ssl:
      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    const policeStationRepo = dataSource.getRepository(PoliceStation);

    // Check if data already exists
    const existingCount = await policeStationRepo.count();

    if (existingCount > 0) {
      console.log(
        `ℹ️  Found ${existingCount} existing police stations. Skipping seed...`,
      );
      console.log(
        '   Use --force flag to clear and re-seed: npm run seed -- --force\n',
      );

      if (process.argv.includes('--force')) {
        console.log('🗑️  Force flag detected. Clearing existing data...');
        await policeStationRepo.clear();
        console.log('✅ Existing data cleared\n');
      } else {
        await dataSource.destroy();
        return;
      }
    }

    // Insert police stations
    console.log('📍 Seeding police stations...');
    const policeStations = policeStationRepo.create(policeStationsSeedData);
    await policeStationRepo.save(policeStations);
    console.log(`✅ Inserted ${policeStations.length} police stations\n`);

    // Summary
    console.log('='.repeat(50));
    console.log('📊 Seeding Summary:');
    console.log(`   - Police Stations: ${policeStations.length}`);
    console.log('='.repeat(50));
    console.log('\n🎉 Database seeding completed successfully!\n');

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seed();
