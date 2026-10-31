import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import {
  RegisterInput,
  LoginInput,
  WorkspaceRole,
  TenantStatus,
  PlanTier,
  CreditTransactionType,
  AiTone,
  AiLanguage,
} from '@omniflow/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async register(input: RegisterInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    // Create user and initial workspace in a single transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash,
          name: input.name,
          emailVerified: true,
        },
      });

      const workspaceName = input.workspaceName || `${input.name.split(' ')[0]}'s Workspace`;
      const baseSlug = workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

      const tenant = await tx.tenant.create({
        data: {
          name: workspaceName,
          slug: uniqueSlug,
          currency: 'BDT',
          creditBalance: 500,
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
          description: 'Welcome bonus AI credits',
        },
      });

      // Assign workspace membership as OWNER
      const member = await tx.workspaceMember.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: WorkspaceRole.OWNER,
        },
      });

      // Create default AI Agent Config
      await tx.aiAgentConfig.create({
        data: {
          tenantId: tenant.id,
          personaName: `${workspaceName} Assistant`,
          systemPrompt: `You are the AI assistant for ${workspaceName}. Provide friendly, accurate customer support and assist with orders in both Bengali and English.`,
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

      return { user, tenant, member };
    });

    const token = this.jwtService.sign({
      sub: result.user.id,
      email: result.user.email,
      tenantId: result.tenant.id,
      role: WorkspaceRole.OWNER,
      isSuperAdmin: result.user.isSuperAdmin,
    });

    return {
      token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        isSuperAdmin: result.user.isSuperAdmin,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        currency: result.tenant.currency,
        creditBalance: result.tenant.creditBalance,
        role: WorkspaceRole.OWNER,
      },
    };
  }

  async login(input: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: {
        memberships: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Default to first active workspace
    const primaryMembership = user.memberships[0];

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      tenantId: primaryMembership?.tenantId,
      role: primaryMembership?.role,
      isSuperAdmin: user.isSuperAdmin,
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        isSuperAdmin: user.isSuperAdmin,
      },
      activeTenant: primaryMembership
        ? {
            id: primaryMembership.tenant.id,
            name: primaryMembership.tenant.name,
            slug: primaryMembership.tenant.slug,
            currency: primaryMembership.tenant.currency,
            creditBalance: primaryMembership.tenant.creditBalance,
            role: primaryMembership.role,
          }
        : null,
      workspaces: user.memberships.map((m) => ({
        id: m.tenant.id,
        name: m.tenant.name,
        slug: m.tenant.slug,
        role: m.role,
        creditBalance: m.tenant.creditBalance,
      })),
    };
  }

  async switchWorkspace(userId: string, targetTenantId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        tenantId_userId: {
          tenantId: targetTenantId,
          userId,
        },
      },
      include: {
        tenant: true,
        user: true,
      },
    });

    if (!membership) {
      throw new UnauthorizedException('You do not belong to this workspace');
    }

    const token = this.jwtService.sign({
      sub: membership.user.id,
      email: membership.user.email,
      tenantId: membership.tenant.id,
      role: membership.role,
      isSuperAdmin: membership.user.isSuperAdmin,
    });

    return {
      token,
      activeTenant: {
        id: membership.tenant.id,
        name: membership.tenant.name,
        slug: membership.tenant.slug,
        currency: membership.tenant.currency,
        creditBalance: membership.tenant.creditBalance,
        role: membership.role,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      isSuperAdmin: user.isSuperAdmin,
      workspaces: user.memberships.map((m) => ({
        id: m.tenant.id,
        name: m.tenant.name,
        slug: m.tenant.slug,
        role: m.role,
        creditBalance: m.tenant.creditBalance,
      })),
    };
  }
}
