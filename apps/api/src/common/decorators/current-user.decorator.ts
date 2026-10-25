import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ProfileDto } from '@bao-bao/shared';

/**
 * Custom decorator to extract the authenticated user from the request.
 * Used in controller methods to access the current user profile.
 * Assumes the user has been attached to the request by an authentication guard.
 *
 * @example
 * async myMethod(@CurrentUser() user: ProfileDto) {
 *   console.log(user.id);
 * }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ProfileDto => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
