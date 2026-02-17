import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Officer } from '../../officers/entities/officer.entity';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Officer)
    private readonly officerRepository: Repository<Officer>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Invalid authorization format. Use Bearer token',
      );
    }

    const token = authHeader.substring(7);

    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      throw new UnauthorizedException('Invalid token');
    }

    const officer = await this.officerRepository.findOne({
      where: { id: payload.sub, isActive: true },
    });

    if (!officer) {
      throw new UnauthorizedException('Officer not found or inactive');
    }

    request.user = officer;
    return true;
  }
}
