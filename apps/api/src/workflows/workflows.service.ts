import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WorkflowInput } from '@omniflow/shared';

@Injectable()
export class WorkflowsService {
  constructor(private readonly prisma: PrismaService) {}

  async listWorkflows(tenantId: string) {
    return this.prisma.workflow.findMany({
      where: { tenantId },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWorkflow(tenantId: string, id: string) {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, tenantId },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
    if (!workflow) throw new NotFoundException('Workflow not found');
    return workflow;
  }

  async createWorkflow(tenantId: string, input: WorkflowInput) {
    return this.prisma.workflow.create({
      data: {
        tenantId,
        name: input.name,
        description: input.description,
        triggerType: input.triggerType,
        triggerConfig: input.triggerConfig || {},
        isActive: input.isActive ?? true,
        steps: {
          create: input.steps.map((s) => ({
            stepOrder: s.stepOrder,
            actionType: s.actionType,
            actionConfig: s.actionConfig,
          })),
        },
      },
      include: { steps: true },
    });
  }

  async toggleWorkflow(tenantId: string, id: string, isActive: boolean) {
    await this.getWorkflow(tenantId, id);
    return this.prisma.workflow.update({
      where: { id },
      data: { isActive },
    });
  }

  async deleteWorkflow(tenantId: string, id: string) {
    await this.getWorkflow(tenantId, id);
    return this.prisma.workflow.delete({ where: { id } });
  }
}
