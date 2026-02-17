import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBasicAuth,
} from '@nestjs/swagger';
import { PoliceStationsService } from './police-stations.service';
import { CreatePoliceStationDto } from './dto/create-police-station.dto';
import { UpdatePoliceStationDto } from './dto/update-police-station.dto';
import { FilterPoliceStationDto } from './dto/filter-police-station.dto';
import { Base64AuthGuard } from '../auth/guards/base64-auth.guard';

@ApiTags('police-stations')
@Controller('police-stations')
export class PoliceStationsController {
  constructor(private readonly policeStationsService: PoliceStationsService) {}

  @Post()
  @UseGuards(Base64AuthGuard)
  @ApiBasicAuth('basic')
  @ApiOperation({ summary: 'Create a new police station' })
  @ApiResponse({
    status: 201,
    description: 'Police station created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createPoliceStationDto: CreatePoliceStationDto) {
    const station = await this.policeStationsService.create(
      createPoliceStationDto,
    );
    return {
      success: true,
      message: 'Police station created successfully',
      data: station,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all police stations with filtering, search, sort, and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'List of police stations retrieved successfully',
  })
  async findAll(@Query() filterDto: FilterPoliceStationDto) {
    const result = await this.policeStationsService.findAll(filterDto);
    return {
      success: true,
      ...result,
    };
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active police stations' })
  @ApiResponse({
    status: 200,
    description: 'List of active police stations',
  })
  async getActiveStations() {
    const stations = await this.policeStationsService.getActiveStations();
    return {
      success: true,
      data: stations,
      total: stations.length,
    };
  }

  @Get('nearest')
  @ApiOperation({
    summary: 'Find the nearest police station to given coordinates',
  })
  @ApiQuery({
    name: 'latitude',
    description: 'Latitude coordinate',
    example: 17.6868,
  })
  @ApiQuery({
    name: 'longitude',
    description: 'Longitude coordinate',
    example: 83.2185,
  })
  @ApiResponse({
    status: 200,
    description: 'Nearest police station found',
  })
  @ApiResponse({
    status: 404,
    description: 'No active police stations found',
  })
  async findNearest(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
  ) {
    const result = await this.policeStationsService.findNearestStation(
      latitude,
      longitude,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get('by-code/:code')
  @ApiOperation({ summary: 'Get a police station by its code' })
  @ApiParam({
    name: 'code',
    description: 'Police station code (e.g., VZG-01)',
  })
  @ApiResponse({ status: 200, description: 'Police station found' })
  @ApiResponse({ status: 404, description: 'Police station not found' })
  async findByCode(@Param('code') code: string) {
    const station = await this.policeStationsService.findByCode(code);
    return {
      success: true,
      data: station,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a police station by ID' })
  @ApiParam({ name: 'id', description: 'Police station UUID' })
  @ApiResponse({ status: 200, description: 'Police station found' })
  @ApiResponse({ status: 404, description: 'Police station not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const station = await this.policeStationsService.findOne(id);
    return {
      success: true,
      data: station,
    };
  }

  @Patch(':id')
  @UseGuards(Base64AuthGuard)
  @ApiBasicAuth('basic')
  @ApiOperation({ summary: 'Update a police station' })
  @ApiParam({ name: 'id', description: 'Police station UUID' })
  @ApiResponse({
    status: 200,
    description: 'Police station updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Police station not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePoliceStationDto: UpdatePoliceStationDto,
  ) {
    const station = await this.policeStationsService.update(
      id,
      updatePoliceStationDto,
    );
    return {
      success: true,
      message: 'Police station updated successfully',
      data: station,
    };
  }

  @Delete(':id')
  @UseGuards(Base64AuthGuard)
  @ApiBasicAuth('basic')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a police station' })
  @ApiParam({ name: 'id', description: 'Police station UUID' })
  @ApiResponse({
    status: 200,
    description: 'Police station deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Police station not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.policeStationsService.remove(id);
    return {
      success: true,
      message: 'Police station deleted successfully',
    };
  }
}
