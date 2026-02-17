import {
  IsString,
  IsOptional,
  IsEnum,
  Length,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ComplaintStatus } from '../enums/complaint-status.enum';
import { Gender } from '../enums/gender.enum';

export class CreateComplaintDto {
  @ApiPropertyOptional({
    description: 'Preferred language for communication',
    example: 'English',
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Name or code of the police station',
    example: 'I Town Police Station',
  })
  @IsOptional()
  @IsString()
  policeStation?: string;

  @ApiPropertyOptional({
    description: 'Full name of the citizen filing the complaint',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  citizenName?: string;

  @ApiPropertyOptional({
    description: '10-digit mobile number',
    example: '9876543210',
    pattern: '^[0-9]{10}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'Mobile number must be 10 digits' })
  mobileNumber?: string;

  @ApiPropertyOptional({
    description: 'Gender of the complainant',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    description: '12-digit Aadhar number',
    example: '123456789012',
    pattern: '^[0-9]{12}$',
  })
  @IsOptional()
  @IsString()
  @Length(12, 12, { message: 'Aadhar number must be exactly 12 digits' })
  @Matches(/^[0-9]{12}$/, { message: 'Aadhar number must contain only digits' })
  aadharNumber?: string;

  @ApiPropertyOptional({
    description: "Father's or Mother's name",
    example: 'James Doe',
  })
  @IsOptional()
  @IsString()
  fatherOrMotherName?: string;

  @ApiPropertyOptional({
    description: 'Permanent address of the citizen',
    example: '123 Main Street, Visakhapatnam',
  })
  @IsOptional()
  @IsString()
  permanentAddress?: string;

  @ApiPropertyOptional({
    description: 'Present/current address of the citizen',
    example: '456 Park Avenue, Visakhapatnam',
  })
  @IsOptional()
  @IsString()
  presentAddress?: string;

  @ApiPropertyOptional({
    description: '6-digit pincode',
    example: '530001',
    pattern: '^[0-9]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'Pincode must be 6 digits' })
  pincode?: string;

  @ApiPropertyOptional({
    description: 'Location where the incident occurred',
    example: 'MG Road Junction, near City Mall',
  })
  @IsOptional()
  @IsString()
  locationOfIncident?: string;

  @ApiPropertyOptional({
    description: 'Detailed summary of the complaint',
    example: 'Theft of mobile phone at bus stop around 3 PM',
  })
  @IsOptional()
  @IsString()
  complaintSummary?: string;

  @ApiPropertyOptional({
    description: 'Initial status of the complaint',
    enum: ComplaintStatus,
    default: ComplaintStatus.NEW,
  })
  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;
}
