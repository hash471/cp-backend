import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Base64AuthGuard } from './guards/base64-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Officer } from '../officers/entities/officer.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Officer]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(
          'JWT_SECRET',
          'default-secret-change-in-production',
        ),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION', '24h') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, Base64AuthGuard, JwtAuthGuard],
  exports: [Base64AuthGuard, JwtAuthGuard, AuthService, JwtModule, TypeOrmModule],
})
export class AuthModule {}
