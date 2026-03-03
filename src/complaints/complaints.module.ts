import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplaintsService } from './complaints.service';
import { ComplaintsController } from './complaints.controller';
import { Complaint } from './entities/complaint.entity';
import { ComplaintLog } from './entities/complaint-log.entity';
import { KioskSequence } from './entities/kiosk-sequence.entity';
import { PoliceStation } from '../police-stations/entities/police-station.entity';
import { S3Service } from '../common/s3.service';

@Module({
  imports: [TypeOrmModule.forFeature([Complaint, ComplaintLog, KioskSequence, PoliceStation])],
  controllers: [ComplaintsController],
  providers: [ComplaintsService, S3Service],
  exports: [ComplaintsService],
})
export class ComplaintsModule {}
