import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SecretariatsService } from './secretariats.service';

@ApiTags('secretariats')
@Controller('secretariats')
export class SecretariatsController {
  constructor(private readonly secretariatsService: SecretariatsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all secretariats, optionally filtered by police station',
  })
  @ApiQuery({
    name: 'policeStation',
    required: false,
    description: 'Police station name to filter secretariats by (exact match)',
    example: 'I Town',
  })
  @ApiResponse({
    status: 200,
    description: 'List of secretariats retrieved successfully',
  })
  async findAll(@Query('policeStation') policeStation?: string) {
    const secretariats = await this.secretariatsService.findAll(policeStation);
    return {
      success: true,
      data: secretariats,
      total: secretariats.length,
    };
  }

  @Get('grouped-by-station')
  @ApiOperation({
    summary: 'Get all police stations together with their associated secretariats',
  })
  @ApiResponse({
    status: 200,
    description: 'Police stations with their secretariats retrieved successfully',
  })
  async findStationsWithSecretariats() {
    const data = await this.secretariatsService.findStationsWithSecretariats();
    return {
      success: true,
      data,
      total: data.length,
    };
  }
}
