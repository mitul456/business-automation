import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  WorkflowInput,
  WorkflowTriggerType,
  WorkflowActionType,
  ConversationStatus,
  LeadStage,
  OrderStatus,
  PaymentStatus,
} from '@omniflow/shared';

@Injectable()
export class WorkflowsService {
  private readonly logger = new Logger(WorkflowsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listWorkflows(tenantId: string) {
    return this.prisma.workflow.findMany({
      where: { tenantId },
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
        _count: { select: { executions: true } },
      },
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
        graphJson: input.graphJson || null,
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

  async updateWorkflow(tenantId: string, id: string, input: Partial<WorkflowInput>) {
    await this.getWorkflow(tenantId, id);

    return this.prisma.$transaction(async (tx) => {
      if (input.steps && input.steps.length > 0) {
        // Delete old steps and recreate
        await tx.workflowStep.deleteMany({ where: { workflowId: id } });
        await tx.workflowStep.createMany({
          data: input.steps.map((s) => ({
            workflowId: id,
            stepOrder: s.stepOrder,
            actionType: s.actionType,
            actionConfig: s.actionConfig,
          })),
        });
      }

      return tx.workflow.update({
        where: { id },
        data: {
          ...(input.name ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.triggerType ? { triggerType: input.triggerType } : {}),
          ...(input.triggerConfig ? { triggerConfig: input.triggerConfig } : {}),
          ...(input.graphJson !== undefined ? { graphJson: input.graphJson } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
        include: { steps: { orderBy: { stepOrder: 'asc' } } },
      });
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

  /**
   * Automation Engine: Evaluate trigger & execute matching active workflows
   */
  async executeTrigger(
    tenantId: string,
    triggerType: WorkflowTriggerType,
    context: Record<string, any>
  ) {
    const activeWorkflows = await this.prisma.workflow.findMany({
      where: {
        tenantId,
        triggerType,
        isActive: true,
      },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });

    const executionResults = [];

    for (const workflow of activeWorkflows) {
      // Evaluate trigger conditions
      const matches = this.evaluateCondition(workflow.triggerConfig, context);
      if (!matches) {
        continue;
      }

      const execution = await this.runWorkflowSteps(tenantId, workflow, context);
      executionResults.push(execution);
    }

    return executionResults;
  }

  /**
   * Execute steps of a workflow against a context
   */
  private async runWorkflowSteps(
    tenantId: string,
    workflow: any,
    context: Record<string, any>,
    retryCount: number = 0
  ) {
    const stepResults: any[] = [];
    let isSuccess = true;
    let errorMessage: string | null = null;
    const startedAt = new Date();

    for (const step of workflow.steps) {
      const stepLog: any = {
        stepOrder: step.stepOrder,
        actionType: step.actionType,
        startedAt: new Date().toISOString(),
      };

      try {
        // If step has conditional branching, check condition first
        const actionCfg = (step.actionConfig as any) || {};
        if (actionCfg.condition) {
          const conditionPassed = this.evaluateCondition(actionCfg.condition, context);
          stepLog.conditionChecked = true;
          stepLog.conditionPassed = conditionPassed;

          if (!conditionPassed) {
            stepLog.status = 'SKIPPED_CONDITION_NOT_MET';
            stepResults.push(stepLog);
            continue;
          }
        }

        const actionResult = await this.executeAction(tenantId, step.actionType as any, actionCfg, context);
        stepLog.status = 'SUCCESS';
        stepLog.output = actionResult;
      } catch (err: any) {
        this.logger.error(`Error executing workflow step ${step.id}: ${err.message}`);
        stepLog.status = 'FAILED';
        stepLog.error = err.message;
        isSuccess = false;
        errorMessage = err.message;
        stepResults.push(stepLog);
        break; // Stop further steps on step failure
      }

      stepResults.push(stepLog);
    }

    // Persist execution history in database
    const execution = await this.prisma.workflowExecution.create({
      data: {
        tenantId,
        workflowId: workflow.id,
        status: isSuccess ? 'SUCCESS' : 'FAILED',
        triggerEvent: workflow.triggerType,
        contextData: context,
        stepResults: stepResults as any,
        errorMessage,
        retryCount,
        startedAt,
        completedAt: new Date(),
      },
    });

    return execution;
  }

  /**
   * Action Dispatcher
   */
  private async executeAction(
    tenantId: string,
    actionType: WorkflowActionType,
    config: Record<string, any>,
    context: Record<string, any>
  ): Promise<any> {
    const customerId = context.customerId || context.customer?.id || context.order?.customerId;
    const conversationId = context.conversationId || context.conversation?.id;

    switch (actionType) {
      case WorkflowActionType.SEND_MESSAGE: {
        if (!conversationId) {
          return { skipped: true, reason: 'No active conversationId in context' };
        }
        const text = this.interpolateString(config.message || 'Hello! Thank you for contacting us.', context);
        const msg = await this.prisma.message.create({
          data: {
            conversationId,
            tenantId,
            senderType: 'BOT',
            content: text,
            contentType: 'TEXT',
          },
        });
        return { messageId: msg.id, textSent: text };
      }

      case WorkflowActionType.ASSIGN_AGENT: {
        const agentId = config.agentId || config.memberId;
        if (conversationId && agentId) {
          await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { assignedMemberId: agentId },
          });
        }
        if (customerId && agentId) {
          await this.prisma.customer.update({
            where: { id: customerId },
            data: { assignedMemberId: agentId },
          });
        }
        return { assignedMemberId: agentId };
      }

      case WorkflowActionType.ADD_CUSTOMER_TAG: {
        const tag = config.tag || config.tagName;
        if (!customerId || !tag) return { skipped: true, reason: 'Missing customerId or tag' };

        const customer = await this.prisma.customer.findFirst({
          where: { id: customerId, tenantId },
        });
        if (!customer) return { skipped: true, reason: 'Customer not found' };

        const existingTags = Array.isArray(customer.tags) ? (customer.tags as string[]) : [];
        if (!existingTags.includes(tag)) {
          const updatedTags = [...existingTags, tag];
          await this.prisma.customer.update({
            where: { id: customerId },
            data: { tags: updatedTags },
          });
          return { addedTag: tag, currentTags: updatedTags };
        }
        return { tagAlreadyPresent: tag };
      }

      case WorkflowActionType.CREATE_LEAD: {
        if (!customerId) return { skipped: true, reason: 'No customerId in context' };
        const stage = config.leadStage || LeadStage.NEW;
        await this.prisma.customer.update({
          where: { id: customerId },
          data: { leadStage: stage },
        });
        await this.prisma.customerTimelineEvent.create({
          data: {
            tenantId,
            customerId,
            eventType: 'LEAD_CREATED',
            title: `Lead Qualified: ${stage}`,
            description: `Automated lead created via workflow`,
          },
        });
        return { leadStage: stage, customerId };
      }

      case WorkflowActionType.CREATE_ORDER_DRAFT: {
        if (!customerId) return { skipped: true, reason: 'No customerId in context' };
        const orderNumber = `DFT-${Date.now().toString().slice(-6)}`;
        const draftOrder = await this.prisma.order.create({
          data: {
            tenantId,
            customerId,
            orderNumber,
            status: OrderStatus.PENDING,
            subtotal: config.amount || 0,
            totalAmount: config.amount || 0,
            paymentStatus: PaymentStatus.UNPAID,
            shippingAddress: config.shippingAddress || { address: 'Draft address' },
            notes: 'Generated via Automation Workflow',
          },
        });
        return { orderId: draftOrder.id, orderNumber: draftOrder.orderNumber };
      }

      case WorkflowActionType.SEND_NOTIFICATION: {
        // Record internal notification / timeline event
        if (customerId) {
          await this.prisma.customerTimelineEvent.create({
            data: {
              tenantId,
              customerId,
              eventType: 'AUTOMATION_NOTIFICATION',
              title: config.title || 'Automation Notification',
              description: this.interpolateString(config.body || 'Notification triggered', context),
            },
          });
        }
        return { notificationSent: true, title: config.title };
      }

      case WorkflowActionType.SCHEDULE_FOLLOWUP: {
        if (!customerId) return { skipped: true, reason: 'No customerId in context' };
        const delayHours = config.delayHours || 24;
        const dueDate = new Date(Date.now() + delayHours * 60 * 60 * 1000);

        const followUp = await this.prisma.followUp.create({
          data: {
            tenantId,
            customerId,
            title: config.title || 'Automated Follow-up',
            notes: config.notes || 'Created by automation workflow',
            dueDate,
          },
        });
        return { followUpId: followUp.id, dueDate: followUp.dueDate };
      }

      case WorkflowActionType.ESCALATE_TO_HUMAN: {
        if (!conversationId) return { skipped: true, reason: 'No conversationId in context' };
        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: {
            status: ConversationStatus.HUMAN_HANDOVER,
            priority: 'HIGH',
          },
        });
        return { escalated: true, conversationId, newStatus: ConversationStatus.HUMAN_HANDOVER };
      }

      case WorkflowActionType.WAIT_DELAY: {
        const delaySeconds = config.seconds || (config.minutes ? config.minutes * 60 : 2);
        // Sandbox simulation: do not block event loop for hours; acknowledge simulated delay
        return { delaySimulatedSeconds: delaySeconds };
      }

      default:
        return { executedType: actionType, config };
    }
  }

  /**
   * Workflow Simulator / Dry-Run Testing
   */
  async testWorkflow(
    tenantId: string,
    workflowId: string,
    mockContext: Record<string, any> = {}
  ) {
    const workflow = await this.getWorkflow(tenantId, workflowId);
    const trace: any[] = [];

    // Evaluate trigger config against mock context
    const triggerMatches = this.evaluateCondition(workflow.triggerConfig, mockContext);
    trace.push({
      phase: 'TRIGGER_EVALUATION',
      triggerType: workflow.triggerType,
      triggerConfig: workflow.triggerConfig,
      matched: triggerMatches,
    });

    if (!triggerMatches) {
      return {
        success: false,
        reason: 'Trigger condition not met by mock context',
        trace,
      };
    }

    for (const step of workflow.steps) {
      const stepTrace: any = {
        stepOrder: step.stepOrder,
        actionType: step.actionType,
        actionConfig: step.actionConfig,
      };

      const actionCfg = (step.actionConfig as any) || {};
      if (actionCfg.condition) {
        const conditionPassed = this.evaluateCondition(actionCfg.condition, mockContext);
        stepTrace.conditionChecked = true;
        stepTrace.conditionPassed = conditionPassed;

        if (!conditionPassed) {
          stepTrace.status = 'SKIPPED_CONDITION_NOT_MET';
          trace.push(stepTrace);
          continue;
        }
      }

      // Simulate dry-run output
      stepTrace.status = 'WOULD_EXECUTE';
      stepTrace.simulatedOutput = {
        action: step.actionType,
        interpolatedDetails: this.interpolateObject(step.actionConfig, mockContext),
      };
      trace.push(stepTrace);
    }

    return {
      success: true,
      workflowName: workflow.name,
      stepsCount: workflow.steps.length,
      trace,
    };
  }

  /**
   * List execution history for tenant/workflow
   */
  async listExecutions(tenantId: string, workflowId?: string, limit: number = 50) {
    return this.prisma.workflowExecution.findMany({
      where: {
        tenantId,
        ...(workflowId ? { workflowId } : {}),
      },
      include: {
        workflow: { select: { id: true, name: true, triggerType: true } },
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Retry a failed execution
   */
  async retryExecution(tenantId: string, executionId: string) {
    const execution = await this.prisma.workflowExecution.findFirst({
      where: { id: executionId, tenantId },
      include: { workflow: { include: { steps: { orderBy: { stepOrder: 'asc' } } } } },
    });

    if (!execution) throw new NotFoundException('Execution record not found');

    const context = (execution.contextData as Record<string, any>) || {};
    const newExecution = await this.runWorkflowSteps(
      tenantId,
      execution.workflow,
      context,
      execution.retryCount + 1
    );

    return newExecution;
  }

  /**
   * Helper: evaluates conditional expressions
   */
  private evaluateCondition(conditionConfig: any, context: Record<string, any>): boolean {
    if (!conditionConfig || Object.keys(conditionConfig).length === 0) {
      return true; // No conditions = unconditionally matches
    }

    for (const [key, expectedValue] of Object.entries(conditionConfig)) {
      if (key === 'condition') continue;

      const actualValue = this.resolvePath(context, key);

      // Support operator conditions: { field: "amount", operator: ">", value: 1000 }
      if (typeof expectedValue === 'object' && expectedValue !== null && 'operator' in expectedValue) {
        const op = (expectedValue as any).operator;
        const targetVal = (expectedValue as any).value;

        if (op === '>') return Number(actualValue) > Number(targetVal);
        if (op === '>=') return Number(actualValue) >= Number(targetVal);
        if (op === '<') return Number(actualValue) < Number(targetVal);
        if (op === '<=') return Number(actualValue) <= Number(targetVal);
        if (op === '!=') return actualValue != targetVal;
        if (op === 'contains') return String(actualValue || '').includes(String(targetVal));
        if (op === '==') return actualValue == targetVal;
      }

      if (actualValue === undefined && expectedValue !== undefined) {
        return false;
      }

      if (String(actualValue).toLowerCase() !== String(expectedValue).toLowerCase()) {
        return false;
      }
    }

    return true;
  }

  private resolvePath(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  private interpolateString(template: string, context: Record<string, any>): string {
    return template.replace(/\{\{([\w.]+)\}\}/g, (_, path) => {
      const val = this.resolvePath(context, path.trim());
      return val !== undefined ? String(val) : '';
    });
  }

  private interpolateObject(obj: any, context: Record<string, any>): any {
    if (typeof obj === 'string') return this.interpolateString(obj, context);
    if (Array.isArray(obj)) return obj.map((item) => this.interpolateObject(item, context));
    if (typeof obj === 'object' && obj !== null) {
      const res: any = {};
      for (const [k, v] of Object.entries(obj)) {
        res[k] = this.interpolateObject(v, context);
      }
      return res;
    }
    return obj;
  }
}
