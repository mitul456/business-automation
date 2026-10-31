import { SetMetadata } from '@nestjs/common';
import { WorkspaceRole } from '@omniflow/shared';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: WorkspaceRole[]) => SetMetadata(ROLES_KEY, roles);
