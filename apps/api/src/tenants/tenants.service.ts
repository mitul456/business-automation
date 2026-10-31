import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTenantInput, InviteMemberInput, WorkspaceRole, TenantStatus } from '@omniflow/shared';

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
          currency: input.currency || 'BDT',
          timezone: input.timezone || 'Asia/Dhaka',
          defaultLanguage: input.defaultLanguage || 'bn',
          creditBalance: 500,
          status: TenantStatus.ACTIVE,
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
        role: input.role || WorkspaceRole.AGENT,
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
