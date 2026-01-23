import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterPoliceStationDto {
  @ApiPropertyOptional({
    description: 'Search by name, code, or address',
    example: 'Town',
  })
  @IsOptional()
  @IsString()
  search?: string;

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
}
