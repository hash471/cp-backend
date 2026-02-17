import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'COMM', description: 'Officer username (e.g., COMM, DCP_ZONE1, INSP_IITOWN)' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: '111111', description: 'Numeric password' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
