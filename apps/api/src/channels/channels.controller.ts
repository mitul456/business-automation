import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { WorkspaceRole, ConnectChannelInput } from '@omniflow/shared';

@Controller('api/v1/channels')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get()
  async getChannels(@Req() req: any) {
    return this.channelsService.listChannels(req.tenantId);
  }

  @Post('connect')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async connectChannel(@Req() req: any, @Body() body: ConnectChannelInput) {
    return this.channelsService.connectChannel(req.tenantId, body);
  }

  @Delete(':channelId')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async disconnectChannel(@Req() req: any, @Param('channelId') channelId: string) {
    return this.channelsService.disconnectChannel(req.tenantId, channelId);
  }
}
