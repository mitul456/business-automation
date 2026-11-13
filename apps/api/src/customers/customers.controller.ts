import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  WorkspaceRole,
  LeadStage,
  CreateCustomerInput,
  UpdateCustomerInput,
  CreateFollowUpInput,
  UpdateFollowUpInput,
} from '@omniflow/shared';

@Controller('api/v1/customers')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async listCustomers(
    @Req() req: any,
    @Query('leadStage') leadStage?: LeadStage,
    @Query('search') search?: string,
    @Query('tag') tag?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.customersService.listCustomers({
      tenantId: req.tenantId,
      leadStage,
      search,
      tag,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
    });
  }

  @Get('segments')
  async getSegments(@Req() req: any) {
    return this.customersService.getCustomerSegments(req.tenantId);
  }

  @Get('leads/kanban')
  async getLeadsKanban(@Req() req: any) {
    return this.customersService.listLeadsKanban(req.tenantId);
  }

  @Get('follow-ups')
  async listFollowUps(
    @Req() req: any,
    @Query('customerId') customerId?: string,
    @Query('isCompleted') isCompleted?: string
  ) {
    return this.customersService.listFollowUps(
      req.tenantId,
      customerId,
      isCompleted !== undefined ? isCompleted === 'true' : undefined
    );
  }

  @Post('follow-ups')
  async createFollowUp(@Req() req: any, @Body() body: CreateFollowUpInput) {
    return this.customersService.createFollowUp(req.tenantId, body);
  }

  @Patch('follow-ups/:id')
  async updateFollowUp(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateFollowUpInput
  ) {
    return this.customersService.updateFollowUp(req.tenantId, id, body);
  }

  @Get(':id')
  async getCustomer(@Req() req: any, @Param('id') id: string) {
    return this.customersService.getCustomer(req.tenantId, id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MANAGER, WorkspaceRole.SALES_AGENT)
  async createCustomer(@Req() req: any, @Body() body: CreateCustomerInput) {
    return this.customersService.createCustomer(req.tenantId, body);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MANAGER, WorkspaceRole.SALES_AGENT)
  async updateCustomer(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateCustomerInput
  ) {
    return this.customersService.updateCustomer(req.tenantId, id, body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER)
  async deleteCustomer(@Req() req: any, @Param('id') id: string) {
    return this.customersService.deleteCustomer(req.tenantId, id);
  }

  @Patch(':id/lead-stage')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MANAGER, WorkspaceRole.SALES_AGENT)
  async updateLeadStage(
    @Req() req: any,
    @Param('id') id: string,
    @Body('leadStage') leadStage: LeadStage
  ) {
    return this.customersService.updateLeadStage(req.tenantId, id, leadStage);
  }

  @Patch(':id/lead-score')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MANAGER, WorkspaceRole.SALES_AGENT)
  async updateLeadScore(
    @Req() req: any,
    @Param('id') id: string,
    @Body('score') score: number
  ) {
    return this.customersService.updateLeadScore(req.tenantId, id, score);
  }

  @Patch(':id/assign')
  @UseGuards(RolesGuard)
  @Roles(WorkspaceRole.ADMIN, WorkspaceRole.OWNER, WorkspaceRole.MANAGER)
  async assignLead(
    @Req() req: any,
    @Param('id') id: string,
    @Body('assignedMemberId') assignedMemberId?: string
  ) {
    return this.customersService.assignLead(req.tenantId, id, assignedMemberId);
  }
}
