import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  UserRole,
  ApprovalStatus,
  DriverChannel,
  ProfileDto,
} from '@bao-bao/shared';

/**
 * Controller for admin dashboard operations.
 * Provides endpoints for dashboard stats, driver/vehicle management, and audit logs.
 * All endpoints require admin role and authentication.
 */
@ApiTags('Admin Dashboard')
@Controller('admin')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  /**
   * Retrieves dashboard statistics for admin overview.
   * @returns Dashboard metrics including active drivers, vehicles, and ride counts
   */
  @Get('dashboard')
  @ApiOperation({ summary: 'Admin KPI summary metrics' })
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  /**
   * Retrieves all drivers with their vehicles and status.
   * @returns List of drivers with vehicle information
   */
  @Get('drivers')
  @ApiOperation({ summary: 'List all drivers with channel and status' })
  async getDrivers() {
    return this.adminService.getDrivers();
  }

  /**
   * Retrieves a specific driver by ID.
   * @param id - The driver ID
   * @returns Driver details with vehicle information
   */
  @Get('drivers/:id')
  @ApiOperation({ summary: 'Get driver details' })
  async getDriverById(@Param('id') id: string) {
    return this.adminService.getDriverById(id);
  }

  /**
   * Updates driver approval status.
   * @param id - The driver ID
   * @param body - Object containing new approval status
   * @param adminUser - The admin user performing the action
   * @returns Updated driver information
   */
  @Patch('drivers/:id/approval')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve, suspend, or reject a driver' })
  async updateDriverApproval(
    @Param('id') id: string,
    @Body() body: { status: ApprovalStatus },
    @CurrentUser() adminUser: ProfileDto,
  ) {
    return this.adminService.updateDriverApproval(id, body.status, adminUser);
  }

  /**
   * Updates driver's primary communication channel.
   * @param id - The driver ID
   * @param body - Object containing new channel
   * @param adminUser - The admin user performing the action
   * @returns Updated driver information
   */
  @Patch('drivers/:id/channel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change primary driver channel (APP, SMS, DISPATCHER)' })
  async updateDriverChannel(
    @Param('id') id: string,
    @Body() body: { channel: DriverChannel },
    @CurrentUser() adminUser: ProfileDto,
  ) {
    return this.adminService.updateDriverChannel(id, body.channel, adminUser);
  }

  /**
   * Retrieves all vehicles with type information.
   * @returns List of vehicles with type details
   */
  @Get('vehicles')
  @ApiOperation({ summary: 'List all vehicles' })
  async getVehicles() {
    return this.adminService.getVehicles();
  }

  /**
   * Updates vehicle approval status.
   * @param id - The vehicle ID
   * @param body - Object containing new approval status
   * @returns Updated vehicle information
   */
  @Patch('vehicles/:id/approval')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve or suspend a vehicle' })
  async updateVehicleApproval(
    @Param('id') id: string,
    @Body() body: { status: ApprovalStatus },
  ) {
    return this.adminService.updateVehicleApproval(id, body.status);
  }

  /**
   * Retrieves all ride requests.
   * @returns List of all rides sorted by request time
   */
  @Get('rides')
  @ApiOperation({ summary: 'All ride requests' })
  async getRides() {
    return this.adminService.getAllRides();
  }

  /**
   * Retrieves audit log of administrative actions.
   * @returns List of audit log entries sorted by timestamp
   */
  @Get('audit-logs')
  @ApiOperation({ summary: 'Audit trail of administrative actions' })
  async getAuditLogs() {
    return this.adminService.getAuditLogs();
  }
}
