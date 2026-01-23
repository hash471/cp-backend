import { Module, Global } from '@nestjs/common';
import { Base64AuthGuard } from './guards/base64-auth.guard';

@Global()
@Module({
  providers: [Base64AuthGuard],
  exports: [Base64AuthGuard],
})
export class AuthModule {}
