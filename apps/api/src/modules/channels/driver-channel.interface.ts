import { DriverChannel } from '@bao-bao/shared';

/**
 * Interface for driver channel adapters.
 * Defines the contract for sending ride offers and updates through different communication channels.
 * Implementations include AppChannel (push notifications), SmsChannel (SMS messages), and DispatcherChannel (terminal console).
 */
export interface DriverChannelAdapter {
  /** The type of driver channel this adapter handles */
  readonly type: DriverChannel;

  /**
   * Sends a ride offer to a driver through this channel.
   * @param offer - The ride offer details
   * @param ride - The ride request details
   * @param driver - The driver information
   */
  sendOffer(offer: any, ride: any, driver: any): Promise<void>;

  /**
   * Sends a ride status update to a driver through this channel.
   * @param driverId - The driver ID
   * @param ride - The ride details
   * @param event - The status event (e.g., ACCEPTED, CANCELLED, ARRIVED)
   */
  sendRideUpdate(driverId: string, ride: any, event: string): Promise<void>;
}
