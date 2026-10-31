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
import { WorkflowsService } from './workflows.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { WorkflowInput } from '@omniflow/shared';

@Controller('api/v1/workflows')
@UseGuards(JwtAuthGuard, TenantGuard)
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get()
  async listWorkflows(@Req() req: any) {
    return this.workflowsService.listWorkflows(req.tenantId);
  }

  @Get(':id')
  async getWorkflow(@Req() req: any, @Param('id') id: string) {
    return this.workflowsService.getWorkflow(req.tenantId, id);
  }

  @Post()
  async createWorkflow(@Req() req: any, @Body() body: WorkflowInput) {
    return this.workflowsService.createWorkflow(req.tenantId, body);
  }

  @Patch(':id/toggle')
  async toggleWorkflow(
    @Req() req: any,
    @Param('id') id: string,
    @Body('isActive') isActive: boolean
  ) {
    return this.workflowsService.toggleWorkflow(req.tenantId, id, isActive);
  }

  @Delete(':id')
  async deleteWorkflow(@Req() req: any, @Param('id') id: string) {
    return this.workflowsService.deleteWorkflow(req.tenantId, id);
  }
}
