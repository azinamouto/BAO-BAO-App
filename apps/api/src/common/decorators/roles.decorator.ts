import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@bao-bao/shared';

// Metadata key for storing required roles
export const ROLES_KEY = 'roles';

// Decorator to specify required roles for routes
export const Roles = (...roles: (UserRole | string)[]) => SetMetadata(ROLES_KEY, roles);
