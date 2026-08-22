import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Simple shared-secret guard. Grants access when the request carries an
 * `x-signature` header matching the `EXTERNAL_LOG_SIGNATURE` value from the
 * environment — no login/JWT required. Intended for trusted server-to-server
 * callers (e.g. the external-call-log ingestion endpoints).
 */
@Injectable()
export class SignatureAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // Node lower-cases all incoming header names.
    const provided = request.headers['x-signature'];

    const expected = this.configService.get<string>('EXTERNAL_LOG_SIGNATURE');
    if (!expected) {
      throw new UnauthorizedException('Signature auth is not configured');
    }

    if (!provided) {
      throw new UnauthorizedException('x-signature header is missing');
    }

    if (provided !== expected) {
      throw new UnauthorizedException('Invalid signature');
    }

    return true;
  }
}
