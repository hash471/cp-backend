import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoliceStationsService } from './police-stations.service';
import { PoliceStationsController } from './police-stations.controller';
import { PoliceStation } from './entities/police-station.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PoliceStation])],
  controllers: [PoliceStationsController],
  providers: [PoliceStationsService],
  exports: [PoliceStationsService],
})
export class PoliceStationsModule {}
