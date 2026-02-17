import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfficersService } from './officers.service';
import { OfficersController } from './officers.controller';
import { Officer } from './entities/officer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Officer])],
  controllers: [OfficersController],
  providers: [OfficersService],
  exports: [OfficersService, TypeOrmModule],
})
export class OfficersModule {}
