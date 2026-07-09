import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecretariatsService } from './secretariats.service';
import { SecretariatsController } from './secretariats.controller';
import { Secretariat } from './entities/secretariat.entity';
import { PoliceStation } from '../police-stations/entities/police-station.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Secretariat, PoliceStation])],
  controllers: [SecretariatsController],
  providers: [SecretariatsService],
  exports: [SecretariatsService],
})
export class SecretariatsModule {}
