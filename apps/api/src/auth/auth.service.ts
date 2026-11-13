import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma.service';
import {
  RegisterInput,
  LoginInput,
  VerifyEmailInput,
  ResendVerificationInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  GoogleAuthInput,
  RefreshTokenInput,
  WorkspaceRole,
  TenantStatus,
  UserStatus,
  PlanTier,
  CreditTransactionType,
  AiTone,
  AiLanguage,
  JwtPayload,
} from '@omniflow/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async createSession(
    userId: string,
    deviceInfo = 'Web Browser',
    ipAddress = '127.0.0.1'
  ): Promise<string> {
    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await this.prisma.userSession.create({
      data: {
        userId,
        tokenHash,
        deviceInfo,
        ipAddress,
        expiresAt,
      },
    });

    return rawRefreshToken;
  }

  private generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }

  async register(input: RegisterInput, deviceInfo?: string, ipAddress?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);
    const emailVerificationToken = crypto.randomBytes(24).toString('hex');
    const emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create user and initial workspace in a single transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash,
          name: input.name,
          isSuperAdmin: false, // Security constraint: new registrations are strictly standard users
          emailVerified: false,
          emailVerificationToken,
          emailVerificationExpiresAt,
        },
      });

      const workspaceName = input.workspaceName || `${input.name.split(' ')[0]}'s Workspace`;
      const baseSlug = workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

      const tenant = await tx.tenant.create({
        data: {
          name: workspaceName,
          slug: uniqueSlug,
          category: 'GENERAL_RETAIL',
          country: 'BD',
          currency: 'BDT',
          timezone: 'Asia/Dhaka',
          defaultLanguage: 'bn',
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

    const token = this.generateAccessToken({
      sub: result.user.id,
      email: result.user.email,
      tenantId: result.tenant.id,
      role: WorkspaceRole.OWNER,
      isSuperAdmin: result.user.isSuperAdmin,
    });

    const refreshToken = await this.createSession(result.user.id, deviceInfo, ipAddress);

    return {
      token,
      refreshToken,
      verificationToken: emailVerificationToken, // Provided for sandbox/dev testing
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        emailVerified: result.user.emailVerified,
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

  async login(input: LoginInput, deviceInfo?: string, ipAddress?: string) {
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

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Your account has been suspended or deactivated. Please contact support.');
    }

    // Default to first active workspace
    const primaryMembership = user.memberships[0];

    const token = this.generateAccessToken({
      sub: user.id,
      email: user.email,
      tenantId: primaryMembership?.tenantId,
      role: primaryMembership?.role as unknown as WorkspaceRole,
      isSuperAdmin: user.isSuperAdmin,
    });

    const refreshToken = await this.createSession(user.id, deviceInfo, ipAddress);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
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

  async verifyEmail(input: VerifyEmailInput) {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: input.token,
        emailVerificationExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired email verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      },
    });

    return {
      success: true,
      message: 'Email address verified successfully',
    };
  }

  async resendVerification(input: ResendVerificationInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      // Don't leak user existence
      return {
        success: true,
        message: 'If an account exists, a verification link has been dispatched',
      };
    }

    if (user.emailVerified) {
      return {
        success: true,
        message: 'Email is already verified',
      };
    }

    const emailVerificationToken = crypto.randomBytes(24).toString('hex');
    const emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken,
        emailVerificationExpiresAt,
      },
    });

    return {
      success: true,
      message: 'Verification email dispatched',
      verificationToken: emailVerificationToken, // Sandbox/dev testing
    };
  }

  async forgotPassword(input: ForgotPasswordInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      return {
        success: true,
        message: 'If your email is registered, you will receive a password reset link',
      };
    }

    const passwordResetToken = crypto.randomBytes(24).toString('hex');
    const passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpiresAt,
      },
    });

    return {
      success: true,
      message: 'Password reset link dispatched',
      resetToken: passwordResetToken, // Sandbox/dev testing
    };
  }

  async resetPassword(input: ResetPasswordInput) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: input.token,
        passwordResetExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.newPassword, salt);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpiresAt: null,
        },
      }),
      // Revoke all existing sessions for security
      this.prisma.userSession.updateMany({
        where: { userId: user.id, revoked: false },
        data: { revoked: true },
      }),
    ]);

    return {
      success: true,
      message: 'Password reset successful. You may now log in with your new credentials.',
    };
  }

  async googleAuth(input: GoogleAuthInput, deviceInfo?: string, ipAddress?: string) {
    if (!input.email) {
      throw new BadRequestException('Email is required for Google authentication');
    }

    const email = input.email.toLowerCase();
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!user) {
      // Create user and workspace
      const defaultPassword = crypto.randomBytes(16).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(defaultPassword, salt);

      const created = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            name: input.name || email.split('@')[0],
            avatarUrl: input.avatarUrl,
            googleId: input.googleId,
            passwordHash,
            emailVerified: true,
          },
        });

        const workspaceName = `${newUser.name.split(' ')[0]}'s Workspace`;
        const baseSlug = workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

        const tenant = await tx.tenant.create({
          data: {
            name: workspaceName,
            slug: uniqueSlug,
            category: 'GENERAL_RETAIL',
            country: 'BD',
            currency: 'BDT',
            status: TenantStatus.ACTIVE,
          },
        });

        await tx.tenantSubscription.create({
          data: {
            tenantId: tenant.id,
            planTier: PlanTier.STARTER,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        await tx.aiCreditTransaction.create({
          data: {
            tenantId: tenant.id,
            amount: 500,
            type: CreditTransactionType.BONUS,
            balanceAfter: 500,
            description: 'Google sign-in bonus AI credits',
          },
        });

        const member = await tx.workspaceMember.create({
          data: {
            tenantId: tenant.id,
            userId: newUser.id,
            role: WorkspaceRole.OWNER,
          },
        });

        return { user: newUser, tenant, member };
      });

      user = await this.prisma.user.findUnique({
        where: { id: created.user.id },
        include: {
          memberships: {
            include: {
              tenant: true,
            },
          },
        },
      });
    } else if (input.googleId && !user.googleId) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: input.googleId,
          emailVerified: true,
          avatarUrl: input.avatarUrl || user.avatarUrl,
        },
      });
    }

    if (!user) {
      throw new UnauthorizedException('Authentication failed');
    }

    const primaryMembership = user.memberships[0];

    const token = this.generateAccessToken({
      sub: user.id,
      email: user.email,
      tenantId: primaryMembership?.tenantId,
      role: primaryMembership?.role as unknown as WorkspaceRole,
      isSuperAdmin: user.isSuperAdmin,
    });

    const refreshToken = await this.createSession(user.id, deviceInfo, ipAddress);

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
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

  async refreshToken(input: RefreshTokenInput, deviceInfo?: string, ipAddress?: string) {
    const tokenHash = this.hashToken(input.refreshToken);

    const session = await this.prisma.userSession.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            memberships: {
              include: {
                tenant: true,
              },
            },
          },
        },
      },
    });

    if (!session || session.revoked || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke old session (token rotation)
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { revoked: true },
    });

    // Create new rotated session
    const newRefreshToken = await this.createSession(
      session.userId,
      deviceInfo || session.deviceInfo || 'Web Browser',
      ipAddress || session.ipAddress || '127.0.0.1'
    );

    const primaryMembership = session.user.memberships[0];

    const token = this.generateAccessToken({
      sub: session.user.id,
      email: session.user.email,
      tenantId: primaryMembership?.tenantId,
      role: primaryMembership?.role as unknown as WorkspaceRole,
      isSuperAdmin: session.user.isSuperAdmin,
    });

    return {
      token,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.userSession.updateMany({
        where: { userId, tokenHash, revoked: false },
        data: { revoked: true },
      });
    } else {
      await this.prisma.userSession.updateMany({
        where: { userId, revoked: false },
        data: { revoked: true },
      });
    }

    return {
      success: true,
      message: 'Successfully logged out',
    };
  }

  async revokeAllSessions(userId: string) {
    await this.prisma.userSession.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });

    return {
      success: true,
      message: 'All active sessions have been revoked',
    };
  }

  async getUserSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: { userId },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        revoked: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
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

    const token = this.generateAccessToken({
      sub: membership.user.id,
      email: membership.user.email,
      tenantId: membership.tenant.id,
      role: membership.role as unknown as WorkspaceRole,
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
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      emailVerified: user.emailVerified,
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
