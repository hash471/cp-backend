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
  ApiSecurity,
} from '@nestjs/swagger';
import { ExternalCallLogsService } from './external-call-logs.service';
import { CreateExternalCallLogDto } from './dto/create-external-call-log.dto';
import { FilterExternalCallLogDto } from './dto/filter-external-call-log.dto';
import { SignatureAuthGuard } from '../auth/guards/signature-auth.guard';

@ApiTags('external-call-logs')
@ApiSecurity('x-signature')
@Controller('external-call-logs')
@UseGuards(SignatureAuthGuard)
export class ExternalCallLogsController {
  constructor(
    private readonly externalCallLogsService: ExternalCallLogsService,
  ) {}

  @Post()
  @ApiOperation({
    summary:
      'Persist a log of an external API request/response (x-signature header auth)',
  })
  @ApiResponse({ status: 201, description: 'External call log created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Missing or invalid x-signature header' })
  async create(@Body() createDto: CreateExternalCallLogDto) {
    const log = await this.externalCallLogsService.create(createDto);
    return {
      success: true,
      message: 'External call log created successfully',
      data: log,
    };
  }

  @Get()
  @ApiOperation({
    summary:
      'List external call logs with filtering and pagination (x-signature header auth)',
  })
  @ApiResponse({ status: 200, description: 'External call logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid x-signature header' })
  async findAll(@Query() filterDto: FilterExternalCallLogDto) {
    const result = await this.externalCallLogsService.findAll(filterDto);
    return {
      success: true,
      ...result,
    };
  }
}
