import { IsOptional, IsString, IsBoolean, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterExternalCallLogDto {
  @ApiPropertyOptional({
    description: 'Filter by service name (partial match)',
    example: 'PGRS',
  })
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiPropertyOptional({
    description: 'Filter by correlation id (exact match)',
    example: 'CP-ABC123-XYZ',
  })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional({
    description: 'Filter by success flag',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  success?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by HTTP status code',
    example: 401,
  })
  @IsOptional()
  @IsInt()
  httpStatus?: number;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page (max 100)',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @IsInt()
  limit?: number;
}
