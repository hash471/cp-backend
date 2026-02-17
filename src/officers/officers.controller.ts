import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
} from '@nestjs/swagger';
import { OfficersService } from './officers.service';
import { CreateOfficerDto } from './dto/create-officer.dto';
import { UpdateOfficerDto } from './dto/update-officer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Officer } from './entities/officer.entity';

@ApiTags('officers')
@ApiBearerAuth('bearer')
@Controller('officers')
@UseGuards(JwtAuthGuard)
export class OfficersController {
  constructor(private readonly officersService: OfficersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new officer' })
  @ApiResponse({ status: 201, description: 'Officer created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Mobile number already exists' })
  async create(@Body() createOfficerDto: CreateOfficerDto) {
    const officer = await this.officersService.create(createOfficerDto);
    const { password, ...result } = officer;
    return {
      success: true,
      message: 'Officer created successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all officers (RBAC filtered)' })
  @ApiResponse({ status: 200, description: 'List of officers' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Req() req: any) {
    const requestingOfficer = req.user as Officer;
    const officers = await this.officersService.findAll(requestingOfficer);
    const data = officers.map(({ password, ...rest }) => rest);
    return {
      success: true,
      data,
      total: data.length,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an officer by ID' })
  @ApiParam({ name: 'id', description: 'Officer UUID' })
  @ApiResponse({ status: 200, description: 'Officer found' })
  @ApiResponse({ status: 404, description: 'Officer not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const officer = await this.officersService.findOne(id);
    const { password, ...result } = officer;
    return {
      success: true,
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an officer' })
  @ApiParam({ name: 'id', description: 'Officer UUID' })
  @ApiResponse({ status: 200, description: 'Officer updated successfully' })
  @ApiResponse({ status: 404, description: 'Officer not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOfficerDto: UpdateOfficerDto,
  ) {
    const officer = await this.officersService.update(id, updateOfficerDto);
    const { password, ...result } = officer;
    return {
      success: true,
      message: 'Officer updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an officer' })
  @ApiParam({ name: 'id', description: 'Officer UUID' })
  @ApiResponse({ status: 200, description: 'Officer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Officer not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.officersService.remove(id);
    return {
      success: true,
      message: 'Officer deleted successfully',
    };
  }
}
