import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBasicAuth,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ExternalCallLogsService } from './external-call-logs.service';
import { CreateExternalCallLogDto } from './dto/create-external-call-log.dto';
import { FilterExternalCallLogDto } from './dto/filter-external-call-log.dto';
import { Base64AuthGuard } from '../auth/guards/base64-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('external-call-logs')
@Controller('external-call-logs')
export class ExternalCallLogsController {
  constructor(
    private readonly externalCallLogsService: ExternalCallLogsService,
  ) {}

  @Post()
  @UseGuards(Base64AuthGuard)
  @ApiBasicAuth('basic')
  @ApiOperation({
    summary: 'Persist a log of an external API request/response',
  })
  @ApiResponse({ status: 201, description: 'External call log created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createDto: CreateExternalCallLogDto) {
    const log = await this.externalCallLogsService.create(createDto);
    return {
      success: true,
      message: 'External call log created successfully',
      data: log,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'List external call logs with filtering and pagination',
  })
  @ApiResponse({ status: 200, description: 'External call logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() filterDto: FilterExternalCallLogDto) {
    const result = await this.externalCallLogsService.findAll(filterDto);
    return {
      success: true,
      ...result,
    };
  }
}
