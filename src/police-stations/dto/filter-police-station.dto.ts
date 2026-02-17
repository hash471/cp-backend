import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Zone } from '../../officers/enums/zone.enum';
import { SubDivision } from '../../officers/enums/sub-division.enum';
import { StationType } from '../enums/station-type.enum';

export class FilterPoliceStationDto {
  @ApiPropertyOptional({
    description: 'Search by name, code, or address',
    example: 'Town',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by zone',
    enum: Zone,
  })
  @IsOptional()
  @IsEnum(Zone)
  zone?: Zone;

  @ApiPropertyOptional({
    description: 'Filter by sub-division',
    enum: SubDivision,
  })
  @IsOptional()
  @IsEnum(SubDivision)
  subDivision?: SubDivision;

  @ApiPropertyOptional({
    description: 'Filter by station type',
    enum: StationType,
  })
  @IsOptional()
  @IsEnum(StationType)
  type?: StationType;

  @ApiPropertyOptional({
    description: 'Filter by district',
    example: 'Visakhapatnam',
  })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({
    description: 'Filter by city',
    example: 'Visakhapatnam',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Latitude for distance calculation',
    example: 17.6868,
  })
  @IsOptional()
  @IsNumber()
  nearLatitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude for distance calculation',
    example: 83.2185,
  })
  @IsOptional()
  @IsNumber()
  nearLongitude?: number;

  @ApiPropertyOptional({
    description: 'Filter stations within this radius (in km)',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  radiusKm?: number;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'name',
    default: 'name',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'ASC',
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
