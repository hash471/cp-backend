import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsArray,
  Matches,
  Min,
  Max,
} from 'class-validator';
import { Zone } from '../../officers/enums/zone.enum';
import { SubDivision } from '../../officers/enums/sub-division.enum';

export class UpdatePoliceStationDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsEnum(Zone)
  zone?: Zone;

  @IsOptional()
  @IsEnum(SubDivision)
  subDivision?: SubDivision;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(/^[0-9]{6}$/, { each: true, message: 'Each pincode must be 6 digits' })
  servicePincodes?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
