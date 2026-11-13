import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateTenantInput,
  UpdateWorkspaceInput,
  InviteMemberInput,
  WorkspaceRole,
} from '@omniflow/shared';

@Controller('api/v1/workspaces')
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  async createWorkspace(
    @CurrentUser('id') userId: string,
    @Body() body: CreateTenantInput
  ) {
    return this.tenantsService.createTenant(userId, body);
  }

  @Get()
  async listUserWorkspaces(@CurrentUser('id') userId: string) {
    return this.tenantsService.listUserWorkspaces(userId);
  }

  @Get('current')
  @UseGuards(TenantGuard)
  async getCurrentWorkspace(@Req() req: any) {
    return this.tenantsService.getTenantDetails(req.tenantId);
  }

  @Patch('current')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async updateCurrentWorkspace(
    @Req() req: any,
    @Body() body: UpdateWorkspaceInput
  ) {
    return this.tenantsService.updateTenant(req.tenantId, body);
  }

  @Get('current/members')
  @UseGuards(TenantGuard)
  async getMembers(@Req() req: any) {
    return this.tenantsService.listMembers(req.tenantId);
  }

  @Post('current/members')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async inviteMember(@Req() req: any, @Body() body: InviteMemberInput) {
    return this.tenantsService.inviteMember(req.tenantId, body);
  }

  @Patch('current/members/:memberId/role')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles(WorkspaceRole.OWNER)
  async updateRole(
    @Req() req: any,
    @Param('memberId') memberId: string,
    @Body('role') role: WorkspaceRole
  ) {
    return this.tenantsService.updateMemberRole(req.tenantId, memberId, role);
  }

  @Delete('current/members/:memberId')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles(WorkspaceRole.OWNER)
  async removeMember(@Req() req: any, @Param('memberId') memberId: string) {
    return this.tenantsService.removeMember(req.tenantId, memberId);
  }
}
