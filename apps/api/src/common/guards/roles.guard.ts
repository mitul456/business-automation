import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspaceRole } from '@omniflow/shared';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<WorkspaceRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userRole = (request.workspaceRole || request.user?.role) as WorkspaceRole;

    if (!userRole) {
      throw new ForbiddenException('Role permission check failed: No role assigned in current workspace context');
    }

    // Role Hierarchy:
    // OWNER (5) > ADMIN (4) > MANAGER (3) > SALES_AGENT / SUPPORT_AGENT / AGENT (2) > VIEWER (1)
    const hierarchy: Record<WorkspaceRole, number> = {
      [WorkspaceRole.OWNER]: 5,
      [WorkspaceRole.ADMIN]: 4,
      [WorkspaceRole.MANAGER]: 3,
      [WorkspaceRole.SALES_AGENT]: 2,
      [WorkspaceRole.SUPPORT_AGENT]: 2,
      [WorkspaceRole.AGENT]: 2,
      [WorkspaceRole.VIEWER]: 1,
    };

    const userLevel = hierarchy[userRole] || 0;
    const hasRole = requiredRoles.some((role) => userLevel >= (hierarchy[role] || 0));

    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient permissions: Role ${userRole} is not authorized for this operation. Required: ${requiredRoles.join(', ')}`
      );
    }

    return true;
  }
}
