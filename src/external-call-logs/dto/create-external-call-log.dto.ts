import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsBoolean,
  IsObject,
  Allow,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExternalCallLogDto {
  @ApiPropertyOptional({
    description: 'Friendly label for the external service/operation',
    example: 'PGRS GetTokenAccess',
  })
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiProperty({
    description: 'HTTP method used for the external call',
    example: 'POST',
  })
  @IsNotEmpty()
  @IsString()
  method: string;

  @ApiProperty({
    description: 'Full URL of the external endpoint that was called',
    example: 'https://pgrs.ap.gov.in/api/GrievanceApp/GetTokenAccess',
  })
  @IsNotEmpty()
  @IsString()
  url: string;

  @ApiPropertyOptional({
    description: 'Request headers sent to the external endpoint',
    example: { 'Content-Type': 'application/json' },
  })
  @IsOptional()
  @IsObject()
  requestHeaders?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Request body sent to the external endpoint (any JSON value)',
    example: { UserID: 'kqwAOKyixCOwlmZ6rC3qoA==', Password: 'e5QIlIGILCY96VLYZojoWw==' },
  })
  @Allow()
  requestBody?: unknown;

  @ApiPropertyOptional({
    description: 'Response headers returned by the external endpoint',
  })
  @IsOptional()
  @IsObject()
  responseHeaders?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Response body returned by the external endpoint (any JSON value)',
    example: { StatusCode: 200, Status: 'Success', Token: 'token-value', Message: '' },
  })
  @Allow()
  responseBody?: unknown;

  @ApiPropertyOptional({
    description: 'HTTP status code returned by the external endpoint',
    example: 200,
  })
  @IsOptional()
  @IsInt()
  httpStatus?: number;

  @ApiPropertyOptional({
    description: 'HTTP status text / reason phrase',
    example: 'OK',
  })
  @IsOptional()
  @IsString()
  statusText?: string;

  @ApiPropertyOptional({
    description:
      'Whether the call succeeded. Defaults to true for a 2xx httpStatus when omitted.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  success?: boolean;

  @ApiPropertyOptional({
    description: 'Round-trip duration of the external call in milliseconds',
    example: 342,
  })
  @IsOptional()
  @IsInt()
  durationMs?: number;

  @ApiPropertyOptional({
    description: 'Error message captured when the external call failed',
  })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiPropertyOptional({
    description: 'Optional correlation id (e.g. complaint number)',
    example: 'CP-ABC123-XYZ',
  })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional({
    description: 'Any additional caller-supplied context',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
