import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Headers,
  Ip,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  RegisterInput,
  LoginInput,
  VerifyEmailInput,
  ResendVerificationInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  GoogleAuthInput,
  RefreshTokenInput,
} from '@omniflow/shared';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: RegisterInput,
    @Headers('user-agent') userAgent?: string,
    @Ip() ip?: string
  ) {
    return this.authService.register(body, userAgent, ip);
  }

  @Post('login')
  async login(
    @Body() body: LoginInput,
    @Headers('user-agent') userAgent?: string,
    @Ip() ip?: string
  ) {
    return this.authService.login(body, userAgent, ip);
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: VerifyEmailInput) {
    return this.authService.verifyEmail(body);
  }

  @Post('resend-verification')
  async resendVerification(@Body() body: ResendVerificationInput) {
    return this.authService.resendVerification(body);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordInput) {
    return this.authService.forgotPassword(body);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordInput) {
    return this.authService.resetPassword(body);
  }

  @Post('google')
  async googleAuth(
    @Body() body: GoogleAuthInput,
    @Headers('user-agent') userAgent?: string,
    @Ip() ip?: string
  ) {
    return this.authService.googleAuth(body, userAgent, ip);
  }

  @Post('refresh-token')
  async refreshToken(
    @Body() body: RefreshTokenInput,
    @Headers('user-agent') userAgent?: string,
    @Ip() ip?: string
  ) {
    return this.authService.refreshToken(body, userAgent, ip);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @CurrentUser('id') userId: string,
    @Body('refreshToken') refreshToken?: string
  ) {
    return this.authService.logout(userId, refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('revoke-sessions')
  async revokeSessions(@CurrentUser('id') userId: string) {
    return this.authService.revokeAllSessions(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getSessions(@CurrentUser('id') userId: string) {
    return this.authService.getUserSessions(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('switch-workspace')
  async switchWorkspace(
    @CurrentUser('id') userId: string,
    @Body('tenantId') targetTenantId: string
  ) {
    return this.authService.switchWorkspace(userId, targetTenantId);
  }
}
