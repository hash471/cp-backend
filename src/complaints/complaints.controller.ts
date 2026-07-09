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
  UseInterceptors,
  UploadedFiles,
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBasicAuth,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { FilterComplaintDto } from './dto/filter-complaint.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignStationDto } from './dto/assign-station.dto';
import { Base64AuthGuard } from '../auth/guards/base64-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Officer } from '../officers/entities/officer.entity';

@ApiTags('complaints')
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  private getOfficer(req: any): Officer {
    return req.user as Officer;
  }

  @Post()
  @UseGuards(Base64AuthGuard)
  @ApiBasicAuth('basic')
  @ApiOperation({ summary: 'Create a new complaint' })
  @ApiResponse({
    status: 201,
    description: 'Complaint created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createComplaintDto: CreateComplaintDto,
  ) {
    const { complaint, trackingUrl } = await this.complaintsService.create(
      createComplaintDto
    );
    return {
      success: true,
      message: 'Complaint created successfully',
      data: complaint,
      trackingUrl,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get all complaints with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of complaints retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() filterDto: FilterComplaintDto,
    @Req() req: any,
  ) {
    const result = await this.complaintsService.findAll(
      filterDto,
      this.getOfficer(req),
    );
    return {
      success: true,
      ...result,
    };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get complaint statistics by status' })
  @ApiResponse({
    status: 200,
    description: 'Complaint statistics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStats(@Req() req: any) {
    const counts = await this.complaintsService.getStatusCounts(
      this.getOfficer(req),
    );
    return {
      success: true,
      data: counts,
    };
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get complaint statistics summary' })
  @ApiResponse({
    status: 200,
    description: 'Complaint statistics retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          totalCases: 100,
          pending: 40,
          resolved: 60,
          citizens: 0,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStatistics(@Req() req: any) {
    const statistics = await this.complaintsService.getStatistics(
      this.getOfficer(req),
    );
    return {
      success: true,
      data: statistics,
    };
  }

  @Get('kiosk-summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get complaints grouped by kiosk number and location' })
  @ApiResponse({
    status: 200,
    description: 'Kiosk summary retrieved successfully',
    schema: {
      example: {
        success: true,
        data: [
          {
            kioskNumber: 'K01',
            kioskLocation: 'City Mall, MG Road',
            totalComplaints: 25,
            closedWithFir: 10,
            closedWithoutFir: 5,
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getKioskSummary(@Req() req: any) {
    const summary = await this.complaintsService.getKioskSummary(
      this.getOfficer(req),
    );
    return {
      success: true,
      data: summary,
    };
  }

  @Get('public')
  @ApiOperation({
    summary: 'Public paginated list of complaints (PII-safe projection, no auth)',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of complaints retrieved successfully',
  })
  async findAllPublic(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.complaintsService.findAllPublic(page, limit);
    return {
      success: true,
      ...result,
    };
  }

  @Get('track/:complaintNumber')
  @ApiOperation({ summary: 'Track complaint status by complaint number (public)' })
  @ApiParam({
    name: 'complaintNumber',
    description: 'The complaint number (e.g., CP-ABC123-XYZ)',
  })
  @ApiResponse({
    status: 200,
    description: 'Complaint status retrieved',
    schema: {
      example: {
        success: true,
        data: {
          complaintNumber: 'CP-ABC123-XYZ',
          status: 'PENDING',
          policeStation: 'II Town',
          createdAt: '2026-02-15T10:00:00.000Z',
          logs: [
            {
              previousStatus: null,
              newStatus: 'PENDING',
              remarks: null,
              changeDescription: 'Complaint created',
              createdAt: '2026-02-15T10:00:00.000Z',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Complaint not found' })
  async trackComplaint(
    @Param('complaintNumber') complaintNumber: string,
  ) {
    const complaint = await this.complaintsService.trackByComplaintNumber(complaintNumber);
    return {
      success: true,
      data: complaint,
    };
  }

  @Get('by-number/:complaintNumber')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
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
    @Req() req: any,
  ) {
    const complaint = await this.complaintsService.findByComplaintNumber(
      complaintNumber,
      this.getOfficer(req),
    );
    return {
      success: true,
      data: complaint,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get a complaint by ID' })
  @ApiParam({ name: 'id', description: 'Complaint UUID' })
  @ApiResponse({ status: 200, description: 'Complaint found' })
  @ApiResponse({ status: 404, description: 'Complaint not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const complaint = await this.complaintsService.findOne(
      id,
      this.getOfficer(req),
    );
    return {
      success: true,
      data: complaint,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Update a complaint' })
  @ApiParam({ name: 'id', description: 'Complaint UUID' })
  @ApiResponse({ status: 200, description: 'Complaint updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Complaint not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateComplaintDto: UpdateComplaintDto,
    @Req() req: any,
  ) {
    const complaint = await this.complaintsService.update(
      id,
      updateComplaintDto,
      this.getOfficer(req),
    );
    return {
      success: true,
      message: 'Complaint updated successfully',
      data: complaint,
    };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Update complaint status' })
  @ApiParam({ name: 'id', description: 'Complaint UUID' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status or already in that status' })
  @ApiResponse({ status: 404, description: 'Complaint not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @Req() req: any,
  ) {
    const complaint = await this.complaintsService.updateStatus(
      id,
      updateStatusDto,
      this.getOfficer(req),
    );
    return {
      success: true,
      message: 'Status updated successfully',
      data: complaint,
    };
  }

  @Patch(':id/assign-station')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Assign or reassign a police station to a complaint' })
  @ApiParam({ name: 'id', description: 'Complaint UUID' })
  @ApiResponse({ status: 200, description: 'Station assigned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid station name' })
  @ApiResponse({ status: 404, description: 'Complaint not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async assignStation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignStationDto: AssignStationDto,
    @Req() req: any,
  ) {
    const complaint = await this.complaintsService.assignStation(
      id,
      assignStationDto.policeStation,
      this.getOfficer(req),
    );
    return {
      success: true,
      message: 'Police station assigned successfully',
      data: complaint,
    };
  }

  @Get(':id/logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get all audit logs for a complaint' })
  @ApiParam({ name: 'id', description: 'Complaint UUID' })
  @ApiResponse({ status: 200, description: 'Logs retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Complaint not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLogs(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const logs = await this.complaintsService.getLogs(
      id,
      this.getOfficer(req),
    );
    return {
      success: true,
      data: logs,
    };
  }

  @Get(':id/images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get presigned URLs for complaint images' })
  @ApiParam({ name: 'id', description: 'Complaint UUID' })
  @ApiResponse({ status: 200, description: 'Presigned URLs generated successfully' })
  @ApiResponse({ status: 404, description: 'Complaint not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getImages(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const images = await this.complaintsService.getImagePresignedUrls(id);
    return {
      success: true,
      data: images,
    };
  }

  @Post(':id/images')
  @UseGuards(Base64AuthGuard)
  @ApiBasicAuth('basic')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload images for a complaint' })
  @ApiParam({ name: 'id', description: 'Complaint UUID' })
  @ApiResponse({ status: 201, description: 'Images uploaded successfully' })
  @ApiResponse({ status: 404, description: 'Complaint not found' })
  async uploadImages(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const complaint = await this.complaintsService.uploadImages(id, files);
    return {
      success: true,
      message: 'Images uploaded successfully',
      data: complaint,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a complaint' })
  @ApiParam({ name: 'id', description: 'Complaint UUID' })
  @ApiResponse({ status: 200, description: 'Complaint deleted successfully' })
  @ApiResponse({ status: 404, description: 'Complaint not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    await this.complaintsService.remove(id, this.getOfficer(req));
    return {
      success: true,
      message: 'Complaint deleted successfully',
    };
  }
}
