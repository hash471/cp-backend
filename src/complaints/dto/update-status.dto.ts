import { IsString, IsNotEmpty, IsEnum, IsOptional, ValidateIf } from 'class-validator';
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
    description: 'FIR number — required when status is CLOSED_WITH_FIR',
    example: 'FIR/2026/001234',
  })
  @ValidateIf((o) => o.status === ComplaintStatus.CLOSED_WITH_FIR)
  @IsNotEmpty({ message: 'firNumber is required when status is CLOSED_WITH_FIR' })
  @IsString()
  firNumber?: string;

  @ApiPropertyOptional({
    description: 'Remarks or notes about the status change',
    example: 'Assigned to Officer Sharma for investigation',
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}
