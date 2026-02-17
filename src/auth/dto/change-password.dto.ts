import { IsString, IsNotEmpty, IsOptional, IsUUID, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiPropertyOptional({
    description: 'Officer ID whose password to change. Omit to change own password.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  officerId?: string;

  @ApiProperty({
    example: '654321',
    description: 'New numeric password (digits only)',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]+$/, { message: 'Password must contain only digits' })
  newPassword: string;
}
