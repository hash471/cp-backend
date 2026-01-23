import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class Base64AuthGuard implements CanActivate {
  private readonly validCredentials: Map<string, string>;

  constructor(private readonly configService: ConfigService) {
    this.validCredentials = this.loadCredentials();
  }

  private loadCredentials(): Map<string, string> {
    const credentials = new Map<string, string>();
    const credentialsStr = this.configService.get<string>(
      'AUTH_CREDENTIALS',
      'admin:admin123,officer:officer123',
    );

    credentialsStr.split(',').forEach((pair) => {
      const [username, password] = pair.trim().split(':');
      if (username && password) {
        credentials.set(username, password);
      }
    });

    return credentials;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
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

    const [username, password] = decoded.split(':');

    if (!username || !password) {
      throw new UnauthorizedException(
        'Invalid credentials format. Expected username:password',
      );
    }

    const storedPassword = this.validCredentials.get(username);

    if (!storedPassword || storedPassword !== password) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Attach user info to request for later use
    (request as any).user = { username };

    return true;
  }
}
