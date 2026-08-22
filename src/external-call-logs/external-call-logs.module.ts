import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalCallLogsService } from './external-call-logs.service';
import { ExternalCallLogsController } from './external-call-logs.controller';
import { ExternalCallLog } from './entities/external-call-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExternalCallLog])],
  controllers: [ExternalCallLogsController],
  providers: [ExternalCallLogsService],
  exports: [ExternalCallLogsService],
})
export class ExternalCallLogsModule {}
