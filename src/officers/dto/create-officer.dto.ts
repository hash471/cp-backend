import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../enums/role.enum';
import { Zone } from '../enums/zone.enum';
import { SubDivision } from '../enums/sub-division.enum';

export class CreateOfficerDto {
  @ApiProperty({ example: 'Sri. V.V.CM.Yerram Naidu' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '9440904716', description: 'Used as login username' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'Mobile number must be 10 digits' })
  mobileNumber: string;

  @ApiProperty({ example: '123456', description: 'Numeric password (digits only)' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]+$/, { message: 'Password must contain only digits' })
  password: string;

  @ApiProperty({ enum: Role, example: Role.INSPECTOR })
  @IsNotEmpty()
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({
    enum: Zone,
    description: 'Required for DCP role',
  })
  @IsOptional()
  @IsEnum(Zone)
  zone?: Zone;

  @ApiPropertyOptional({
    enum: SubDivision,
    description: 'Required for ACP role',
  })
  @IsOptional()
  @IsEnum(SubDivision)
  subDivision?: SubDivision;

  @ApiPropertyOptional({
    example: 'II Town',
    description: 'Required for Inspector/Sub-Inspector role',
  })
  @IsOptional()
  @IsString()
  policeStation?: string;

  @ApiPropertyOptional({ example: 'Inspector' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ example: 'B-1234' })
  @IsOptional()
  @IsString()
  badgeNumber?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
