import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DispatcherService } from './dispatcher.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  UserRole,
  ProfileDto,
  DriverChannel,
  RideStatus,
} from '@bao-bao/shared';

/**
 * Controller for terminal dispatcher console operations.
 * Provides endpoints for queue management, driver assignment, and ride status updates.
 * Requires DISPATCHER or ADMIN role.
 */
@ApiTags('Dispatcher Console')
@Controller('dispatch')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(UserRole.DISPATCHER, UserRole.ADMIN)
@ApiBearerAuth()
export class DispatcherController {
  constructor(@Inject(DispatcherService) private readonly dispatcherService: DispatcherService) {}

  /**
   * Retrieves terminals managed by the current dispatcher.
   * @param user - The authenticated dispatcher
   * @returns List of accessible terminals
   */
  @Get('terminals')
  @ApiOperation({ summary: 'Terminals managed by the current dispatcher' })
  async getTerminals(@CurrentUser() user: ProfileDto) {
    return this.dispatcherService.getTerminals(user.id);
  }

  /**
   * Retrieves rides for terminal dispatch.
   * @param status - Optional status filter
   * @returns List of rides with driver information
   */
  @Get('rides')
  @ApiOperation({ summary: 'Pending / active rides for terminal dispatch' })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getRides(@Query('status') status?: string) {
    return this.dispatcherService.getRides(status);
  }

  /**
   * Retrieves drivers with their queue status and locations.
   * @param terminalId - Optional terminal ID filter
   * @returns List of drivers with enhanced information
   */
  @Get('drivers')
  @ApiOperation({ summary: 'Drivers in terminal queue or nearby with channel + status' })
  @ApiQuery({ name: 'terminalId', required: false, type: String })
  async getDrivers(@Query('terminalId') terminalId?: string) {
    return this.dispatcherService.getDrivers(terminalId);
  }

  /**
   * Checks a driver into the terminal queue.
   * @param body - Terminal and driver IDs
   * @returns Queue entry with position
   */
  @Post('queue/check-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check in a driver to the terminal queue' })
  async checkIn(@Body() body: { terminalId: string; driverId: string }) {
    return this.dispatcherService.queueCheckIn(body.terminalId, body.driverId);
  }

  /**
   * Checks a driver out of the terminal queue.
   * @param body - Terminal and driver IDs
   * @returns Updated queue entry
   */
  @Post('queue/check-out')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check out a driver from the terminal queue' })
  async checkOut(@Body() body: { terminalId: string; driverId: string }) {
    return this.dispatcherService.queueCheckOut(body.terminalId, body.driverId);
  }

  /**
   * Manually assigns a driver to a ride.
   * @param rideId - The ride ID
   * @param body - Driver ID
   * @param dispatcher - The authenticated dispatcher
   * @returns Updated ride information
   */
  @Post('rides/:id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign driver to ride on their behalf' })
  async assignRide(
    @Param('id') rideId: string,
    @Body() body: { driverId: string },
    @CurrentUser() dispatcher: ProfileDto,
  ) {
    return this.dispatcherService.assignRide(rideId, body.driverId, dispatcher);
  }

  /**
   * Updates ride status on behalf of the driver.
   * @param rideId - The ride ID
   * @param body - New ride status
   * @param dispatcher - The authenticated dispatcher
   * @returns Updated ride information
   */
  @Post('rides/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update ride status on driver behalf (ARRIVED, IN_PROGRESS, COMPLETED)' })
  async updateRideStatus(
    @Param('id') rideId: string,
    @Body() body: { status: RideStatus },
    @CurrentUser() dispatcher: ProfileDto,
  ) {
    return this.dispatcherService.updateRideStatusOnBehalf(rideId, body.status, dispatcher);
  }

  /**
   * Creates an offline driver (SMS or Terminal channel).
   * @param body - Driver and vehicle details
   * @param dispatcher - The authenticated dispatcher
   * @returns Created driver information
   */
  @Post('drivers')
  @ApiOperation({ summary: 'Create a no-phone / SMS-only driver record' })
  async createDriver(
    @Body()
    body: {
      fullName: string;
      phoneNumber?: string;
      licenseNo: string;
      primaryChannel: DriverChannel;
      vehiclePlate: string;
      vehicleTypeCode: string;
      homeTerminalId?: string;
    },
    @CurrentUser() dispatcher: ProfileDto,
  ) {
    return this.dispatcherService.createOfflineDriver(body, dispatcher);
  }
}
