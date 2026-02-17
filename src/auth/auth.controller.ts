import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Officer } from '../officers/entities/officer.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with username and password to get JWT token' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        success: true,
        message: 'Login successful',
        data: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          officer: {
            id: 'uuid',
            username: 'COMM',
            name: 'Commissioner of Police',
            role: 'COMMISSIONER',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      success: true,
      message: 'Login successful',
      data: result,
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change password (own or subordinate based on hierarchy)',
  })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: any,
  ) {
    const officer = req.user as Officer;
    await this.authService.changePassword(changePasswordDto, officer);
    return {
      success: true,
      message: 'Password changed successfully',
    };
  }
}
