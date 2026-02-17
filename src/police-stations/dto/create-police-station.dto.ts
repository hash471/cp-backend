import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Zone } from '../../officers/enums/zone.enum';
import { SubDivision } from '../../officers/enums/sub-division.enum';

export class CreatePoliceStationDto {
  @ApiProperty({
    description: 'Unique code for the police station',
    example: 'VZG-01',
  })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Name of the police station',
    example: 'I Town Police Station',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Full address of the police station',
    example: 'One Town, Visakhapatnam',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'District name',
    example: 'Visakhapatnam',
  })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({
    description: 'City name',
    example: 'Visakhapatnam',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'State name',
    example: 'Andhra Pradesh',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Pincode',
    example: '530001',
  })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional({
    description: 'Contact phone number',
    example: '0891-2564001',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Latitude coordinate (-90 to 90)',
    example: 17.6868,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate (-180 to 180)',
    example: 83.2185,
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Zone the station belongs to',
    enum: Zone,
    example: Zone.ZONE_1,
  })
  @IsOptional()
  @IsEnum(Zone)
  zone?: Zone;

  @ApiPropertyOptional({
    description: 'Sub-division the station belongs to',
    enum: SubDivision,
    example: SubDivision.EAST,
  })
  @IsOptional()
  @IsEnum(SubDivision)
  subDivision?: SubDivision;

  @ApiPropertyOptional({
    description: 'Whether the station is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
