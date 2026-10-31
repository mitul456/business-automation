import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CouriersService } from './couriers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { WorkspaceRole, CourierSettingInput } from '@omniflow/shared';

@Controller('api/v1/couriers')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CouriersController {
  constructor(private readonly couriersService: CouriersService) {}

  @Get('settings')
  async getSettings(@Req() req: any) {
    return this.couriersService.getSettings(req.tenantId);
  }

  @Post('settings')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async saveSetting(@Req() req: any, @Body() body: CourierSettingInput) {
    return this.couriersService.saveCourierSetting(req.tenantId, body);
  }

  @Post('dispatch/steadfast/:orderId')
  async dispatchSteadfast(@Req() req: any, @Param('orderId') orderId: string) {
    return this.couriersService.dispatchToSteadfast(req.tenantId, orderId);
  }

  @Get('track/steadfast/:consignmentId')
  async trackParcel(@Req() req: any, @Param('consignmentId') consignmentId: string) {
    return this.couriersService.trackParcel(req.tenantId, consignmentId);
  }

  @Get('balance/steadfast')
  async getBalance(@Req() req: any) {
    return this.couriersService.getSteadfastBalance(req.tenantId);
  }
}
