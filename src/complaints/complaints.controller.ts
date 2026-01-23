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
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBasicAuth,
} from '@nestjs/swagger';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { FilterComplaintDto } from './dto/filter-complaint.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Base64AuthGuard } from '../auth/guards/base64-auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: { username: string };
}

@ApiTags('complaints')
@ApiBasicAuth('basic')
@Controller('complaints')
@UseGuards(Base64AuthGuard)
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new complaint' })
  @ApiResponse({
    status: 201,
    description: 'Complaint created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createComplaintDto: CreateComplaintDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const complaint = await this.complaintsService.create(
      createComplaintDto,
      req.user?.username,
    );
    return {
      success: true,
      message: 'Complaint created successfully',
      data: complaint,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all complaints with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of complaints retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() filterDto: FilterComplaintDto) {
    const result = await this.complaintsService.findAll(filterDto);
    return {
      success: true,
      ...result,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get complaint statistics by status' })
  @ApiResponse({
    status: 200,
    description: 'Complaint statistics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStats() {
    const counts = await this.complaintsService.getStatusCounts();
    return {
      success: true,
      data: counts,
    };
  }

  @Get('by-number/:complaintNumber')
  @ApiOperation({ summary: 'Get a complaint by complaint number' })
  @ApiParam({
    name: 'complaintNumber',
    description: 'The complaint number (e.g., CP-ABC123-XYZ)',
  })
  @ApiResponse({ status: 200, description: 'Complaint found' })
  @ApiResponse({ status: 404, description: 'Complaint not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findByComplaintNumber(
    @Param('complaintNumber') complaintNumber: string,
  ) {
    const complaint =
      await this.complaintsService.findByComplaintNumber(complaintNumber);
    return {
      success: true,
      data: complaint,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a complaint by ID' })
  @ApiParam({ name: 'id', description: 'Complaint UUID' })
  @ApiResponse({ status: 200, description: 'Complaint found' })
  @ApiResponse({ status: 404, description: 'Complaint not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const complaint = await this.complaintsService.findOne(id);
    return {
      success: true,
      data: complaint,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a complaint' })
  @ApiParam({ name: 'id', description: 'Complaint UUID' })
  @ApiResponse({ status: 200, description: 'Complaint updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Complaint not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateComplaintDto: UpdateComplaintDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const complaint = await this.complaintsService.update(
      id,
      updateComplaintDto,
      req.user?.username,
    );
    return {
      success: true,
      message: 'Complaint updated successfully',
      data: complaint,
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update complaint status' })
  @ApiParam({ name: 'id', description: 'Complaint UUID' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status or already in that status' })
  @ApiResponse({ status: 404, description: 'Complaint not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const complaint = await this.complaintsService.updateStatus(
      id,
      updateStatusDto,
      req.user?.username,
    );
    return {
      success: true,
      message: 'Status updated successfully',
      data: complaint,
    };
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get all audit logs for a complaint' })
  @ApiParam({ name: 'id', description: 'Complaint UUID' })
  @ApiResponse({ status: 200, description: 'Logs retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Complaint not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLogs(@Param('id', ParseUUIDPipe) id: string) {
    const logs = await this.complaintsService.getLogs(id);
    return {
      success: true,
      data: logs,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a complaint' })
  @ApiParam({ name: 'id', description: 'Complaint UUID' })
  @ApiResponse({ status: 200, description: 'Complaint deleted successfully' })
  @ApiResponse({ status: 404, description: 'Complaint not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.complaintsService.remove(id);
    return {
      success: true,
      message: 'Complaint deleted successfully',
    };
  }
}
