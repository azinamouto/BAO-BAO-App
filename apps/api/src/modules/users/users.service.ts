import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuthSyncDto, UpdateProfileDto, ProfileDto, UserRole } from '@bao-bao/shared';

/**
 * Service for managing user profiles.
 * Handles profile synchronization, retrieval, updates, and deactivation.
 */
@Injectable()
export class UsersService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  /**
   * Synchronizes user profile from auth provider (Supabase).
   * Creates new profile if it doesn't exist, updates if it does.
   * @param userId - The user ID from auth provider
   * @param dto - Profile data from auth provider
   * @returns Synchronized profile
   */
  async syncProfile(userId: string, dto: AuthSyncDto): Promise<ProfileDto> {
    let profile = this.db.profiles.find((p) => p.id === userId);

    if (!profile) {
      profile = {
        id: userId,
        fullName: dto.fullName || 'New User',
        phoneNumber: dto.phoneNumber || null,
        email: dto.email || null,
        role: dto.role || UserRole.PASSENGER,
        preferredLanguage: dto.preferredLanguage || 'en',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      this.db.profiles.push(profile);
    } else {
      if (dto.fullName) profile.fullName = dto.fullName;
      if (dto.phoneNumber) profile.phoneNumber = dto.phoneNumber;
      if (dto.preferredLanguage) profile.preferredLanguage = dto.preferredLanguage;
    }

    return profile;
  }

  /**
   * Retrieves the current user's profile.
   * @param userId - The user ID
   * @returns User profile
   * @throws NotFoundException if profile not found
   */
  async getMe(userId: string): Promise<ProfileDto> {
    const profile = this.db.profiles.find((p) => p.id === userId);
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  /**
   * Updates the current user's profile.
   * Only updates fields that are provided in the DTO.
   * @param userId - The user ID
   * @param dto - Profile update data
   * @returns Updated profile
   * @throws NotFoundException if profile not found
   */
  async updateMe(userId: string, dto: UpdateProfileDto): Promise<ProfileDto> {
    const profile = this.db.profiles.find((p) => p.id === userId);
    if (!profile) throw new NotFoundException('Profile not found');

    if (dto.fullName) profile.fullName = dto.fullName;
    if (dto.phoneNumber) profile.phoneNumber = dto.phoneNumber;
    if (dto.preferredLanguage) profile.preferredLanguage = dto.preferredLanguage;

    return profile;
  }

  /**
   * Deactivates the current user's account.
   * Sets isActive to false to disable the account.
   * @param userId - The user ID
   * @returns Success confirmation
   * @throws NotFoundException if profile not found
   */
  async deactivateMe(userId: string): Promise<{ success: boolean }> {
    const profile = this.db.profiles.find((p) => p.id === userId);
    if (!profile) throw new NotFoundException('Profile not found');
    profile.isActive = false;
    return { success: true };
  }
}
