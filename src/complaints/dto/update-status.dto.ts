import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ComplaintStatus } from '../enums/complaint-status.enum';

export class UpdateStatusDto {
  @ApiProperty({
    description: 'New status for the complaint',
    enum: ComplaintStatus,
    example: ComplaintStatus.ASSIGNED,
  })
  @IsNotEmpty()
  @IsEnum(ComplaintStatus)
  status: ComplaintStatus;

  @ApiPropertyOptional({
    description: 'Remarks or notes about the status change',
    example: 'Assigned to Officer Sharma for investigation',
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}
