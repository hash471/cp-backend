import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Base64AuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    if (!authHeader.startsWith('Basic ')) {
      throw new UnauthorizedException(
        'Invalid authorization format. Use Basic authentication',
      );
    }

    const base64Credentials = authHeader.substring(6);

    let decoded: string;
    try {
      decoded = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    } catch {
      throw new UnauthorizedException('Invalid Base64 encoding');
    }

    const colonIndex = decoded.indexOf(':');
    if (colonIndex === -1) {
      throw new UnauthorizedException(
        'Invalid credentials format. Expected username:password',
      );
    }

    const username = decoded.substring(0, colonIndex);
    const password = decoded.substring(colonIndex + 1);

    const expectedUsername = this.configService.get<string>(
      'COMPLAINT_API_USERNAME',
      'admin',
    );
    const expectedPassword = this.configService.get<string>(
      'COMPLAINT_API_PASSWORD',
      'admin123',
    );

    if (username !== expectedUsername || password !== expectedPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return true;
  }
}
