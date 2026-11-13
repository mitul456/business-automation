import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { TenantStatus, UserStatus } from '@omniflow/shared';

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
    @Req() req: any,
    @Param('id') id: string,
    @Body('status') status: TenantStatus
  ) {
    return this.superAdminService.updateTenantStatus(id, status, req.user?.id);
  }

  @Post('tenants/:id/credits')
  async addBonusCredits(
    @Req() req: any,
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Body('reason') reason: string
  ) {
    return this.superAdminService.addBonusCredits(id, amount, reason, req.user?.id);
  }

  @Get('users')
  async listUsers(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.superAdminService.listUsers(
      search,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { status: UserStatus; isSuperAdmin?: boolean }
  ) {
    return this.superAdminService.updateUserStatus(
      id,
      body.status,
      body.isSuperAdmin,
      req.user?.id
    );
  }

  @Post('users/:id/revoke')
  async revokeUserSessions(@Req() req: any, @Param('id') id: string) {
    return this.superAdminService.revokeUserSessions(id, req.user?.id);
  }

  @Get('transactions')
  async listTransactions(
    @Query('provider') provider?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.superAdminService.listAllTransactions(
      provider,
      status,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );
  }

  @Get('settings')
  async getPlatformSettings() {
    return this.superAdminService.getPlatformSettings();
  }

  @Post('settings')
  async updatePlatformSetting(
    @Req() req: any,
    @Body() body: { key: string; value: any }
  ) {
    return this.superAdminService.updatePlatformSetting(body.key, body.value, req.user?.id);
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Query('action') action?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.superAdminService.getAuditLogs(
      action,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 30
    );
  }

  // Top-Up Requests & Approvals
  @Get('topup-requests')
  async listTopupRequests(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.superAdminService.listTopupRequests(
      status,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );
  }

  @Post('topup-requests/:id/approve')
  async approveTopupRequest(@Req() req: any, @Param('id') id: string) {
    return this.superAdminService.approveTopupRequest(id, req.user?.id);
  }

  @Post('topup-requests/:id/reject')
  async rejectTopupRequest(
    @Req() req: any,
    @Param('id') id: string,
    @Body('reason') reason: string
  ) {
    return this.superAdminService.rejectTopupRequest(id, reason || 'Transaction not recognized', req.user?.id);
  }

  // Dynamic Payment Methods
  @Get('payment-methods')
  async listPaymentMethods() {
    return this.superAdminService.listPaymentMethods();
  }

  @Post('payment-methods')
  async createPaymentMethod(@Req() req: any, @Body() body: any) {
    return this.superAdminService.createPaymentMethod(body, req.user?.id);
  }

  @Patch('payment-methods/:id')
  async updatePaymentMethod(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.superAdminService.updatePaymentMethod(id, body, req.user?.id);
  }

  @Post('payment-methods/:id/delete')
  async deletePaymentMethod(@Req() req: any, @Param('id') id: string) {
    return this.superAdminService.deletePaymentMethod(id, req.user?.id);
  }

  // Dynamic API Configurations
  @Get('api-configs')
  async listApiConfigs() {
    return this.superAdminService.listApiConfigs();
  }

  @Post('api-configs')
  async upsertApiConfig(@Req() req: any, @Body() body: any) {
    return this.superAdminService.upsertApiConfig(body, req.user?.id);
  }

  @Post('api-configs/:providerKey/test')
  async testApiConnection(@Param('providerKey') providerKey: string) {
    return this.superAdminService.testApiConnection(providerKey);
  }

  // User Details & Direct Adjustment
  @Get('users/:id')
  async getUserDetails(@Param('id') id: string) {
    return this.superAdminService.getUserDetails(id);
  }

  @Post('users/:id/credits')
  async adjustUserCredits(
    @Req() req: any,
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Body('reason') reason: string
  ) {
    return this.superAdminService.adjustUserCredits(id, amount, reason, req.user?.id);
  }
}
