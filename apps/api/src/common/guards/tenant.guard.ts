import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    // Platform Super Admin bypasses workspace check if accessing admin APIs
    if (user.isSuperAdmin && request.url.startsWith('/api/v1/super-admin')) {
      return true;
    }

    // Resolve tenant ID from header or JWT
    const tenantId = (request.headers['x-tenant-id'] as string) || user.tenantId;

    if (!tenantId) {
      throw new BadRequestException('Workspace identifier (x-tenant-id) is required');
    }

    // Verify user is an active member of this workspace
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId: user.id,
        },
      },
      include: {
        tenant: true,
      },
    });

    if (!member) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    // Attach tenant and membership to request context
    request.tenantId = tenantId;
    request.tenant = member.tenant;
    request.workspaceRole = member.role;
    request.memberId = member.id;

    return true;
  }
}
