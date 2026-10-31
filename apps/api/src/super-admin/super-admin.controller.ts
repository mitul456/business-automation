import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { TenantStatus } from '@omniflow/shared';

@Controller('api/v1/super-admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('stats')
  async getPlatformStats() {
    return this.superAdminService.getPlatformStats();
  }

  @Get('tenants')
  async listTenants(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.superAdminService.listTenants(
      search,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );
  }

  @Patch('tenants/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: TenantStatus
  ) {
    return this.superAdminService.updateTenantStatus(id, status);
  }

  @Post('tenants/:id/credits')
  async addBonusCredits(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Body('reason') reason: string
  ) {
    return this.superAdminService.addBonusCredits(id, amount, reason);
  }
}
