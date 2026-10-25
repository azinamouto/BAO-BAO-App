import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@bao-bao/shared';

/**
 * Metadata key for storing required roles.
 * Used by RolesGuard to check user permissions.
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for a controller or method.
 * Used in conjunction with RolesGuard to enforce role-based access control.
 *
 * @param roles - Array of required user roles
 * @example
 * @Roles(UserRole.ADMIN, UserRole.DRIVER)
 * async adminMethod() { ... }
 */
export const Roles = (...roles: (UserRole | string)[]) => SetMetadata(ROLES_KEY, roles);
