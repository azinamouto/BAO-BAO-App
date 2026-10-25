import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import {
  ApprovalStatus,
  DriverChannel,
  DriverAvailability,
  RideStatus,
  ProfileDto,
} from '@bao-bao/shared';
import { DatabaseService } from '../database/database.service';

/**
 * Service for admin operations.
 * Handles dashboard statistics, driver/vehicle approvals, and audit logging.
 */
@Injectable()
export class AdminService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  /**
   * Retrieves dashboard statistics for admin overview.
   * Includes active drivers, vehicles, ride counts, and acceptance rates by channel.
   * @returns Dashboard statistics object
   */
  async getDashboardStats(): Promise<any> {
    const activeDrivers = this.db.drivers.filter(
      (d) => d.approvalStatus === ApprovalStatus.APPROVED && d.availability !== DriverAvailability.OFFLINE,
    ).length;

    const activeVehicles = this.db.vehicles.filter(
      (v) => v.approvalStatus === ApprovalStatus.APPROVED && v.isActive,
    ).length;

    const ridesToday = this.db.rideRequests.length;
    const pendingRequests = this.db.rideRequests.filter(
      (r) => r.status === RideStatus.REQUESTED || r.status === RideStatus.DISPATCHING || r.status === RideStatus.OFFERED,
    ).length;

    const activeRides = this.db.rideRequests.filter(
      (r) =>
        r.status === RideStatus.ACCEPTED ||
        r.status === RideStatus.DRIVER_EN_ROUTE ||
        r.status === RideStatus.ARRIVED ||
        r.status === RideStatus.IN_PROGRESS,
    ).length;

    // Acceptance rate by channel
    const channels = [DriverChannel.APP, DriverChannel.SMS, DriverChannel.DISPATCHER];
    const acceptanceRateByChannel: Record<string, number> = {};

    for (const ch of channels) {
      const totalOffers = this.db.rideOffers.filter((o) => o.channel === ch).length;
      const acceptedOffers = this.db.rideOffers.filter(
        (o) => o.channel === ch && o.status === 'ACCEPTED',
      ).length;
      acceptanceRateByChannel[ch] = totalOffers > 0 ? Math.round((acceptedOffers / totalOffers) * 100) : 100;
    }

    return {
      activeDrivers,
      activeVehicles,
      ridesToday,
      pendingRequests,
      activeRides,
      totalDrivers: this.db.drivers.length,
      acceptanceRateByChannel,
    };
  }

  /**
   * Retrieves all drivers with their associated vehicles.
   * @returns List of drivers with vehicle information
   */
  async getDrivers(): Promise<any[]> {
    return this.db.drivers.map((d) => {
      const dv = this.db.driverVehicles.find((rel) => rel.driverId === d.id && rel.isCurrent);
      const vehicle = dv ? this.db.vehicles.find((v) => v.id === dv.vehicleId) : null;
      return {
        ...d,
        vehicle,
      };
    });
  }

  /**
   * Retrieves a specific driver by ID with vehicle information.
   * @param id - The driver ID
   * @returns Driver with vehicle information
   * @throws NotFoundException if driver not found
   */
  async getDriverById(id: string): Promise<any> {
    const driver = this.db.drivers.find((d) => d.id === id);
    if (!driver) throw new NotFoundException('Driver not found');
    const dv = this.db.driverVehicles.find((rel) => rel.driverId === driver.id && rel.isCurrent);
    const vehicle = dv ? this.db.vehicles.find((v) => v.id === dv.vehicleId) : null;
    return { ...driver, vehicle };
  }

  /**
   * Updates driver approval status.
   * Automatically sets availability based on approval status.
   * Logs the action in audit trail.
   * @param id - The driver ID
   * @param status - New approval status
   * @param adminUser - The admin user performing the action
   * @returns Updated driver information
   * @throws NotFoundException if driver not found
   */
  async updateDriverApproval(
    id: string,
    status: ApprovalStatus,
    adminUser: ProfileDto,
  ): Promise<any> {
    const driver = this.db.drivers.find((d) => d.id === id);
    if (!driver) throw new NotFoundException('Driver not found');

    const previousStatus = driver.approvalStatus;
    driver.approvalStatus = status;

    if (status === ApprovalStatus.APPROVED) {
      driver.availability = DriverAvailability.AVAILABLE;
    } else {
      driver.availability = DriverAvailability.OFFLINE;
    }

    this.db.auditLogs.push({
      id: `audit-${Date.now()}`,
      actorId: adminUser.id,
      action: 'UPDATE_DRIVER_APPROVAL',
      entity: 'drivers',
      entityId: driver.id,
      diff: { from: previousStatus, to: status },
      createdAt: new Date().toISOString(),
    });

    return driver;
  }

  /**
   * Updates driver's primary communication channel.
   * Logs the action in audit trail.
   * @param id - The driver ID
   * @param channel - New primary channel
   * @param adminUser - The admin user performing the action
   * @returns Updated driver information
   * @throws NotFoundException if driver not found
   */
  async updateDriverChannel(
    id: string,
    channel: DriverChannel,
    adminUser: ProfileDto,
  ): Promise<any> {
    const driver = this.db.drivers.find((d) => d.id === id);
    if (!driver) throw new NotFoundException('Driver not found');

    const prev = driver.primaryChannel;
    driver.primaryChannel = channel;

    this.db.auditLogs.push({
      id: `audit-${Date.now()}`,
      actorId: adminUser.id,
      action: 'UPDATE_DRIVER_CHANNEL',
      entity: 'drivers',
      entityId: driver.id,
      diff: { from: prev, to: channel },
      createdAt: new Date().toISOString(),
    });

    return driver;
  }

  /**
   * Retrieves all vehicles with type information.
   * @returns List of vehicles with type details
   */
  async getVehicles(): Promise<any[]> {
    return this.db.vehicles.map((v) => {
      const vType = this.db.vehicleTypes.find((vt) => vt.id === v.vehicleTypeId);
      return {
        ...v,
        vehicleTypeCode: vType?.code,
        vehicleTypeName: vType?.name,
      };
    });
  }

  /**
   * Updates vehicle approval status.
   * @param id - The vehicle ID
   * @param status - New approval status
   * @returns Updated vehicle information
   * @throws NotFoundException if vehicle not found
   */
  async updateVehicleApproval(id: string, status: ApprovalStatus): Promise<any> {
    const vehicle = this.db.vehicles.find((v) => v.id === id);
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    vehicle.approvalStatus = status;
    return vehicle;
  }

  /**
   * Retrieves all ride requests sorted by request time (newest first).
   * @returns List of all rides
   */
  async getAllRides(): Promise<any[]> {
    return [...this.db.rideRequests].sort(
      (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
    );
  }

  /**
   * Retrieves audit logs sorted by timestamp (newest first).
   * @returns List of audit log entries
   */
  async getAuditLogs(): Promise<any[]> {
    return [...this.db.auditLogs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
}
