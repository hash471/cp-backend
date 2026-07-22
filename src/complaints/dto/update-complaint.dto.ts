import {
  IsString,
  IsOptional,
  IsEnum,
  Length,
  Matches,
} from 'class-validator';
import { ComplaintStatus } from '../enums/complaint-status.enum';

export class UpdateComplaintDto {
  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  policeStation?: string;

  @IsOptional()
  @IsString()
  secretariat?: string;

  @IsOptional()
  @IsString()
  citizenName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'Mobile number must be 10 digits' })
  mobileNumber?: string;

  @IsOptional()
  @IsString()
  @Length(12, 12, { message: 'Aadhar number must be exactly 12 digits' })
  @Matches(/^[0-9]{12}$/, { message: 'Aadhar number must contain only digits' })
  aadharNumber?: string;

  @IsOptional()
  @IsString()
  fatherOrMotherName?: string;

  @IsOptional()
  @IsString()
  permanentAddress?: string;

  @IsOptional()
  @IsString()
  presentAddress?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'Pincode must be 6 digits' })
  pincode?: string;

  @IsOptional()
  @IsString()
  locationOfIncident?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  subSubject?: string;

  @IsOptional()
  @IsString()
  subSubjectCode?: string;

  @IsOptional()
  @IsString()
  complaintSummary?: string;

  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @IsOptional()
  @IsString()
  statusRemarks?: string;
}
