import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser, RegisterInput, LoginInput } from '@omniflow/shared';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterInput) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: LoginInput) {
    return this.authService.login(body);
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
