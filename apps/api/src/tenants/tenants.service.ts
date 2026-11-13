import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CreateTenantInput,
  UpdateWorkspaceInput,
  InviteMemberInput,
  WorkspaceRole,
  TenantStatus,
  PlanTier,
  CreditTransactionType,
  AiTone,
  AiLanguage,
} from '@omniflow/shared';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async createTenant(userId: string, input: CreateTenantInput) {
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: input.slug },
    });
    if (existing) {
      throw new ConflictException('A workspace with this URL slug already exists');
    }

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: input.name,
          slug: input.slug,
          category: input.category || 'GENERAL_RETAIL',
          country: input.country || 'BD',
          currency: input.currency || 'BDT',
          timezone: input.timezone || 'Asia/Dhaka',
          defaultLanguage: input.defaultLanguage || 'bn',
          creditBalance: 500,
          businessSettings: input.businessSettings || null,
          status: TenantStatus.ACTIVE,
        },
      });

      // Grant subscription
      await tx.tenantSubscription.create({
        data: {
          tenantId: tenant.id,
          planTier: PlanTier.STARTER,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // Grant initial credits
      await tx.aiCreditTransaction.create({
        data: {
          tenantId: tenant.id,
          amount: 500,
          type: CreditTransactionType.BONUS,
          balanceAfter: 500,
          description: 'Initial workspace bonus credits',
        },
      });

      // Create default AI Agent Config
      await tx.aiAgentConfig.create({
        data: {
          tenantId: tenant.id,
          personaName: `${input.name} Assistant`,
          systemPrompt: `You are the AI assistant for ${input.name}. Provide friendly, accurate customer support and assist with orders in both Bengali and English.`,
          tone: AiTone.FRIENDLY,
          language: AiLanguage.AUTO,
          capabilities: {
            autoOrderCreation: true,
            productSearch: true,
            imageRecognition: true,
            voiceTranscription: true,
            bookingAppointment: true,
            sentimentAnalysis: true,
          },
          handoverKeywords: ['human', 'agent', 'support', 'প্রতিনিধি'],
          fallbackMessageEn: 'Connecting you to a human agent shortly.',
          fallbackMessageBn: 'আপনাকে কাস্টমার এজেন্টের সাথে যুক্ত করে দিচ্ছি।',
        },
      });

      await tx.workspaceMember.create({
        data: {
          tenantId: tenant.id,
          userId,
          role: WorkspaceRole.OWNER,
        },
      });

      return tenant;
    });
  }

  async updateTenant(tenantId: string, input: UpdateWorkspaceInput) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Workspace not found');
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.category && { category: input.category }),
        ...(input.country && { country: input.country }),
        ...(input.timezone && { timezone: input.timezone }),
        ...(input.currency && { currency: input.currency }),
        ...(input.defaultLanguage && { defaultLanguage: input.defaultLanguage }),
        ...(input.businessSettings && { businessSettings: input.businessSettings }),
      },
    });
  }

  async getTenantDetails(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          take: 1,
        },
        _count: {
          select: {
            members: true,
            channels: true,
            conversations: true,
            products: true,
            orders: true,
          },
        },
      },
    });

    if (!tenant) throw new NotFoundException('Workspace not found');
    return tenant;
  }

  async listUserWorkspaces(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        tenant: {
          include: {
            _count: {
              select: {
                members: true,
                channels: true,
                conversations: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) => ({
      membershipId: m.id,
      role: m.role,
      tenant: {
        id: m.tenant.id,
        name: m.tenant.name,
        slug: m.tenant.slug,
        category: m.tenant.category,
        country: m.tenant.country,
        currency: m.tenant.currency,
        timezone: m.tenant.timezone,
        creditBalance: m.tenant.creditBalance,
        status: m.tenant.status,
        memberCount: m.tenant._count.members,
        channelCount: m.tenant._count.channels,
        conversationCount: m.tenant._count.conversations,
      },
    }));
  }

  async listMembers(tenantId: string) {
    return this.prisma.workspaceMember.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async inviteMember(tenantId: string, input: InviteMemberInput) {
    let user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      // Auto-create invited stub user
      user = await this.prisma.user.create({
        data: {
          email: input.email.toLowerCase(),
          name: input.email.split('@')[0],
          passwordHash: '$2b$10$wT8Kz5hX5E8uG9g8g5hZ0uYhLzN7UaJbN1uKlMnOpQrStUvWxYz.2', // default placeholder
          status: 'INVITED',
        },
      });
    }

    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: { tenantId_userId: { tenantId, userId: user.id } },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this workspace');
    }

    return this.prisma.workspaceMember.create({
      data: {
        tenantId,
        userId: user.id,
        role: input.role || WorkspaceRole.SUPPORT_AGENT,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async updateMemberRole(tenantId: string, memberId: string, newRole: WorkspaceRole) {
    const member = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, tenantId },
    });

    if (!member) throw new NotFoundException('Member not found');
    if (member.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException('Cannot modify Owner role');
    }

    return this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: newRole },
    });
  }

  async removeMember(tenantId: string, memberId: string) {
    const member = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, tenantId },
    });

    if (!member) throw new NotFoundException('Member not found');
    if (member.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException('Cannot remove the workspace Owner');
    }

    return this.prisma.workspaceMember.delete({
      where: { id: memberId },
    });
  }
}
