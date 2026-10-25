import { Injectable, Logger, Inject } from '@nestjs/common';
import { DriverChannel, SmsDirection, SmsStatus } from '@bao-bao/shared';
import { DriverChannelAdapter } from './driver-channel.interface';
import { DatabaseService } from '../database/database.service';

/**
 * Channel adapter for smartphone app drivers.
 * Sends push notifications for ride offers and updates.
 */
@Injectable()
export class AppChannel implements DriverChannelAdapter {
  readonly type = DriverChannel.APP;
  private readonly logger = new Logger(AppChannel.name);

  /**
   * Sends a ride offer to the driver's app via push notification.
   * @param offer - The ride offer details
   * @param ride - The ride request details
   * @param driver - The driver information
   */
  async sendOffer(offer: any, ride: any, driver: any): Promise<void> {
    this.logger.log(
      `[APP CHANNEL] Pushed offer ${offer.id} to App Driver ${driver.driverCode} (${driver.fullName}) for ride #${ride.publicCode}`,
    );
  }

  /**
   * Sends a ride status update to the driver's app.
   * @param driverId - The driver ID
   * @param ride - The ride details
   * @param event - The status event (e.g., ACCEPTED, CANCELLED)
   */
  async sendRideUpdate(driverId: string, ride: any, event: string): Promise<void> {
    this.logger.log(`[APP CHANNEL] Ride #${ride.publicCode} update: ${event} -> driver ${driverId}`);
  }
}

/**
 * Channel adapter for SMS-based drivers.
 * Sends SMS messages for ride offers and updates.
 */
@Injectable()
export class SmsChannel implements DriverChannelAdapter {
  readonly type = DriverChannel.SMS;
  private readonly logger = new Logger(SmsChannel.name);

  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  /**
   * Sends a ride offer via SMS to the driver.
   * @param offer - The ride offer details
   * @param ride - The ride request details
   * @param driver - The driver information
   */
  async sendOffer(offer: any, ride: any, driver: any): Promise<void> {
    const body = `BAO BAO REQUEST #${ride.publicCode}: ${ride.passengerCount} pax from ${ride.pickupLabel} to ${ride.destinationLabel}. Reply 1 to accept or 2 to decline.`;
    this.logger.log(`[SMS CHANNEL] Outbound SMS to ${driver.phoneNumber}: "${body}"`);

    // Persist SMS record in sms_messages table
    this.db.smsMessages.push({
      id: `sms-${Date.now()}`,
      direction: SmsDirection.OUT,
      phoneNumber: driver.phoneNumber || 'UNKNOWN',
      body,
      rideOfferId: offer.id,
      status: SmsStatus.SENT,
      providerMessageId: `mock-msg-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Sends a ride status update via SMS to the driver.
   * @param driverId - The driver ID
   * @param ride - The ride details
   * @param event - The status event
   */
  async sendRideUpdate(driverId: string, ride: any, event: string): Promise<void> {
    const driver = this.db.drivers.find((d) => d.id === driverId);
    if (!driver || !driver.phoneNumber) return;

    const body = `BAO BAO UPDATE: Ride #${ride.publicCode} status changed to ${event}.`;
    this.logger.log(`[SMS CHANNEL] Notification SMS to ${driver.phoneNumber}: "${body}"`);

    this.db.smsMessages.push({
      id: `sms-${Date.now()}`,
      direction: SmsDirection.OUT,
      phoneNumber: driver.phoneNumber,
      body,
      rideOfferId: null,
      status: SmsStatus.SENT,
      providerMessageId: `mock-msg-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
  }
}

/**
 * Channel adapter for terminal dispatcher console.
 * Routes offers and updates to the terminal dispatcher interface.
 */
@Injectable()
export class DispatcherChannel implements DriverChannelAdapter {
  readonly type = DriverChannel.DISPATCHER;
  private readonly logger = new Logger(DispatcherChannel.name);

  /**
   * Routes a ride offer to the terminal dispatcher console.
   * @param offer - The ride offer details
   * @param ride - The ride request details
   * @param driver - The driver information
   */
  async sendOffer(offer: any, ride: any, driver: any): Promise<void> {
    this.logger.log(
      `[DISPATCHER CHANNEL] Routed offer ${offer.id} for ride #${ride.publicCode} to Terminal Console for Driver ${driver.driverCode} (${driver.fullName})`,
    );
  }

  /**
   * Sends a ride status update to the terminal dispatcher console.
   * @param driverId - The driver ID
   * @param ride - The ride details
   * @param event - The status event
   */
  async sendRideUpdate(driverId: string, ride: any, event: string): Promise<void> {
    this.logger.log(
      `[DISPATCHER CHANNEL] Ride #${ride.publicCode} status changed to ${event} for terminal driver ${driverId}`,
    );
  }
}

/**
 * Service for managing driver channel adapters.
 * Provides access to the appropriate adapter based on driver's primary channel.
 */
@Injectable()
export class ChannelsService {
  private adapters: Map<DriverChannel, DriverChannelAdapter> = new Map();

  constructor(
    @Inject(AppChannel) private readonly appAdapter: AppChannel,
    @Inject(SmsChannel) private readonly smsAdapter: SmsChannel,
    @Inject(DispatcherChannel) private readonly dispatcherAdapter: DispatcherChannel,
  ) {
    this.adapters.set(DriverChannel.APP, this.appAdapter);
    this.adapters.set(DriverChannel.SMS, this.smsAdapter);
    this.adapters.set(DriverChannel.DISPATCHER, this.dispatcherAdapter);
  }

  /**
   * Retrieves the channel adapter for a specific driver channel.
   * @param channel - The driver channel type
   * @returns The corresponding channel adapter
   * @throws Error if no adapter found for the channel
   */
  getAdapter(channel: DriverChannel): DriverChannelAdapter {
    const adapter = this.adapters.get(channel);
    if (!adapter) {
      throw new Error(`No adapter found for driver channel: ${channel}`);
    }
    return adapter;
  }
}
