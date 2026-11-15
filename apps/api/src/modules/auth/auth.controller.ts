import { Controller, Post, Body, UseGuards, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthSyncDto, ProfileDto } from '@bao-bao/shared';

/**
 * Controller for authentication and profile synchronization.
 * Handles profile sync from Supabase Auth to local database.
 */
@ApiTags('Auth & Profile')
@Controller('auth')
export class AuthController {
  // Dependency injection for user management
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  /**
   * Synchronizes user profile from Supabase Auth to local database.
   * Creates new profile if it doesn't exist, updates if it does.
   * @param user - The authenticated user from Supabase
   * @param dto - Profile synchronization data
   * @returns Synchronized profile
   */
  @Post('sync')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create or synchronize profile in database after Supabase Auth',
    description: 'Ensures a profiles table row exists for the Supabase user ID with role and settings.',
  })
  @ApiResponse({ status: 200, description: 'Profile synchronized' })
  async syncProfile(
    @CurrentUser() user: ProfileDto,
    @Body() dto: AuthSyncDto,
  ) {
    return this.usersService.syncProfile(user.id, dto);
  }
}
