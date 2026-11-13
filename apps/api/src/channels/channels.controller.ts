import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
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

  @Get('oauth/meta/url')
  async getMetaOAuthUrl(@Req() req: any, @Query('redirectUri') redirectUri?: string) {
    const url = this.channelsService.getMetaOAuthUrl(undefined, redirectUri, req.tenantId);
    return { url };
  }

  @Post('oauth/meta/callback')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async handleMetaOAuthCallback(
    @Req() req: any,
    @Body() body: { code: string; redirectUri?: string }
  ) {
    const accounts = await this.channelsService.exchangeMetaOAuthCode(body.code, body.redirectUri);
    return { accounts };
  }
}
