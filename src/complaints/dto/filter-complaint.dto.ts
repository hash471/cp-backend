import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ComplaintStatus } from '../enums/complaint-status.enum';

export class FilterComplaintDto {
  @ApiPropertyOptional({
    description: 'Filter by complaint number (partial match)',
    example: 'CP-ABC',
  })
  @IsOptional()
  @IsString()
  complaintNumber?: string;

  @ApiPropertyOptional({
    description: 'Filter by language',
    example: 'English',
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Filter by police station (partial match)',
    example: 'I Town',
  })
  @IsOptional()
  @IsString()
  policeStation?: string;

  @ApiPropertyOptional({
    description: 'Filter by citizen name (partial match)',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  citizenName?: string;

  @ApiPropertyOptional({
    description: 'Filter by mobile number (partial match)',
    example: '9876',
  })
  @IsOptional()
  @IsString()
  mobileNumber?: string;

  @ApiPropertyOptional({
    description: 'Filter by Aadhar number (partial match)',
  })
  @IsOptional()
  @IsString()
  aadharNumber?: string;

  @ApiPropertyOptional({
    description: 'Filter by father/mother name (partial match)',
  })
  @IsOptional()
  @IsString()
  fatherOrMotherName?: string;

  @ApiPropertyOptional({
    description: 'Filter by permanent address (partial match)',
  })
  @IsOptional()
  @IsString()
  permanentAddress?: string;

  @ApiPropertyOptional({
    description: 'Filter by present address (partial match)',
  })
  @IsOptional()
  @IsString()
  presentAddress?: string;

  @ApiPropertyOptional({
    description: 'Filter by pincode (exact match)',
    example: '530001',
  })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional({
    description: 'Filter by location of incident (partial match)',
  })
  @IsOptional()
  @IsString()
  locationOfIncident?: string;

  @ApiPropertyOptional({
    description: 'Filter by complaint summary (partial match)',
  })
  @IsOptional()
  @IsString()
  complaintSummary?: string;

  @ApiPropertyOptional({
    description: 'Filter by complaint status',
    enum: ComplaintStatus,
  })
  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @ApiPropertyOptional({
    description: 'Filter complaints created after this date (ISO format)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @ApiPropertyOptional({
    description: 'Filter complaints created before this date (ISO format)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  createdBefore?: string;

  @ApiPropertyOptional({
    description: 'Global search across multiple fields',
    example: 'theft',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'createdAt',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page (max 100)',
    example: 10,
    default: 10,
  })
  @IsOptional()
  limit?: number;
}
