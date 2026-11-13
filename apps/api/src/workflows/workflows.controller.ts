import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { WorkflowInput, WorkflowTriggerType } from '@omniflow/shared';

@Controller('api/v1/workflows')
@UseGuards(JwtAuthGuard, TenantGuard)
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get()
  async listWorkflows(@Req() req: any) {
    return this.workflowsService.listWorkflows(req.tenantId);
  }

  @Get('executions/history')
  async listExecutions(
    @Req() req: any,
    @Query('workflowId') workflowId?: string,
    @Query('limit') limit?: string
  ) {
    return this.workflowsService.listExecutions(
      req.tenantId,
      workflowId,
      limit ? parseInt(limit, 10) : 50
    );
  }

  @Post('executions/:id/retry')
  async retryExecution(@Req() req: any, @Param('id') id: string) {
    return this.workflowsService.retryExecution(req.tenantId, id);
  }

  @Get(':id')
  async getWorkflow(@Req() req: any, @Param('id') id: string) {
    return this.workflowsService.getWorkflow(req.tenantId, id);
  }

  @Post()
  async createWorkflow(@Req() req: any, @Body() body: WorkflowInput) {
    return this.workflowsService.createWorkflow(req.tenantId, body);
  }

  @Patch(':id')
  async updateWorkflow(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: Partial<WorkflowInput>
  ) {
    return this.workflowsService.updateWorkflow(req.tenantId, id, body);
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

  @Post(':id/test')
  async testWorkflow(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { mockContext?: Record<string, any> }
  ) {
    return this.workflowsService.testWorkflow(req.tenantId, id, body.mockContext || {});
  }

  @Post('trigger')
  async triggerWorkflow(
    @Req() req: any,
    @Body() body: { triggerType: WorkflowTriggerType; context: Record<string, any> }
  ) {
    return this.workflowsService.executeTrigger(req.tenantId, body.triggerType, body.context || {});
  }
}
