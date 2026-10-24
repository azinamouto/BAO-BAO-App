import { z } from 'zod';
import {
  UserRole,
  DriverAvailability,
  ApprovalStatus,
  DriverChannel,
} from './enums.js';

/**
 * Schema for synchronizing user profile from auth provider.
 * Validates profile data received during authentication flow.
 */
export const authSyncSchema = z.object({
  fullName: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRole).default(UserRole.PASSENGER),
  preferredLanguage: z.string().default('en'),
});

/**
 * Schema for updating user profile.
 * Allows partial updates to profile fields.
 */
export const updateProfileSchema = z.object({
  fullName: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
  preferredLanguage: z.string().optional(),
});

/**
 * Schema for driver registration.
 * Validates driver information and vehicle details.
 */
export const registerDriverSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phoneNumber: z.string().optional(),
  licenseNo: z.string().min(3, 'License number is required'),
  vehicleTypeId: z.string().uuid('Invalid vehicle type'),
  plateOrBodyNo: z.string().min(1, 'Plate or Body number is required'),
  capacity: z.number().int().min(1).max(20).default(3),
  homeTerminalId: z.string().uuid().optional(),
});

/**
 * Schema for updating driver availability status.
 */
export const updateDriverStatusSchema = z.object({
  availability: z.nativeEnum(DriverAvailability),
});

/**
 * Schema for driver location updates from GPS.
 * Validates latitude, longitude, and optional accuracy/heading.
 */
export const driverLocationUpdateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  heading: z.number().optional(),
});

/**
 * Schema for creating a new ride request.
 * Validates pickup, destination, passenger count, and notes.
 */
export const createRideSchema = z.object({
  pickup: z.object({
    lat: z.number(),
    lng: z.number(),
    label: z.string().min(1, 'Pickup location label is required'),
    zoneId: z.string().uuid().optional(),
  }),
  destination: z.object({
    lat: z.number(),
    lng: z.number(),
    label: z.string().min(1, 'Destination location label is required'),
  }),
  passengerCount: z.number().int().min(1).max(10).default(1),
  notes: z.string().max(250).optional(),
});

/**
 * Schema for cancelling a ride.
 * Requires a cancellation reason.
 */
export const cancelRideSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required'),
});

/**
 * Schema for rating a completed ride.
 * Validates score (1-5) and optional comment.
 */
export const rateRideSchema = z.object({
  score: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

/**
 * Schema for reporting an incident.
 * Validates incident category and description.
 */
export const reportIncidentSchema = z.object({
  category: z.string().min(1),
  description: z.string().min(5),
});

/**
 * Schema for assigning a driver to a ride (dispatcher action).
 */
export const assignRideSchema = z.object({
  driverId: z.string().min(1),
});

/**
 * Schema for terminal queue check-in/check-out.
 * Validates terminal and driver IDs.
 */
export const queueCheckInOutSchema = z.object({
  terminalId: z.string().min(1),
  driverId: z.string().min(1),
});

/**
 * Schema for inbound SMS webhook from SMS gateway.
 * Validates sender phone number, message body, and optional metadata.
 */
export const inboundSmsSchema = z.object({
  from: z.string().min(7),
  body: z.string().min(1),
  timestamp: z.string().optional(),
  signature: z.string().optional(),
});

/**
 * Schema for updating approval status (admin action).
 * Validates new status and optional notes.
 */
export const updateApprovalSchema = z.object({
  status: z.nativeEnum(ApprovalStatus),
  notes: z.string().optional(),
});

/**
 * Schema for updating driver's primary channel.
 * Validates new channel assignment.
 */
export const updateDriverChannelSchema = z.object({
  channel: z.nativeEnum(DriverChannel),
});
