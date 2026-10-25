import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DatabaseService } from '../database/database.service';

/**
 * Controller for zone and coverage area information.
 * Provides endpoint for retrieving active pickup zones and terminals.
 */
@ApiTags('Zones')
@Controller('zones')
export class ZonesController {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  /**
   * Retrieves all active zones in Talibon.
   * Includes pickup zones, terminals, and coverage areas.
   * @returns List of active zones
   */
  @Get()
  @ApiOperation({ summary: 'List all pickup zones, terminals, and coverage areas in Talibon' })
  @ApiResponse({ status: 200, description: 'List of active zones' })
  async getZones() {
    return this.db.zones.filter((z) => z.isActive);
  }
}
