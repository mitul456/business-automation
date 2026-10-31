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
    const userRole = request.workspaceRole as WorkspaceRole;

    if (!userRole) {
      throw new ForbiddenException('Role permission check failed: No role assigned');
    }

    // Role hierarchy: OWNER > ADMIN > MANAGER > AGENT
    const hierarchy: Record<WorkspaceRole, number> = {
      [WorkspaceRole.OWNER]: 4,
      [WorkspaceRole.ADMIN]: 3,
      [WorkspaceRole.MANAGER]: 2,
      [WorkspaceRole.AGENT]: 1,
    };

    const userLevel = hierarchy[userRole] || 0;
    const hasRole = requiredRoles.some((role) => userLevel >= (hierarchy[role] || 0));

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions for this action');
    }

    return true;
  }
}
