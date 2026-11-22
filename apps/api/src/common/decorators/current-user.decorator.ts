import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ProfileDto } from '@bao-bao/shared';

// Extract current user from request context
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ProfileDto => {
    const request = ctx.switchToHttp().getRequest();
    // User is set by SupabaseAuthGuard
    return request.user;
  },
);
