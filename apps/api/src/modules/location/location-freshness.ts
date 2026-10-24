import { TrackingSource } from '@bao-bao/shared';

/**
 * Result of location freshness calculation.
 * Includes the effective tracking source after downgrade rules,
 * the age of the location data, and whether it should be hidden.
 */
export interface FreshnessResult {
  effectiveSource: TrackingSource;
  ageSeconds: number;
  isHidden: boolean;
}

/**
 * Threshold in seconds for LIVE_APP location to be considered fresh.
 * Locations older than this are downgraded to LAST_REPORTED.
 */
export const LIVE_APP_FRESHNESS_THRESHOLD_SEC = 120; // 2 minutes

/**
 * Threshold in seconds for location visibility on the map.
 * Locations older than this are hidden from passengers.
 */
export const MAP_VISIBILITY_EXPIRY_SEC = 1800; // 30 minutes

/**
 * Calculates location freshness and applies honesty downgrade rules.
 *
 * Downgrade rules:
 * - LIVE_APP locations older than 2 minutes become LAST_REPORTED
 * - Locations older than 30 minutes are hidden from the map
 *
 * @param originalSource - The original tracking source of the location
 * @param locationUpdatedAt - When the location was last updated (Date or ISO string)
 * @param now - Current time for calculation (defaults to now)
 * @returns FreshnessResult with effective source, age, and visibility status
 */
export function calculateLocationFreshness(
  originalSource: TrackingSource,
  locationUpdatedAt: Date | string,
  now: Date = new Date(),
): FreshnessResult {
  const updatedTime = typeof locationUpdatedAt === 'string'
    ? new Date(locationUpdatedAt).getTime()
    : locationUpdatedAt.getTime();
  const currentTime = now.getTime();
  const ageSeconds = Math.max(0, Math.floor((currentTime - updatedTime) / 1000));

  // Beyond 30 minutes, hidden from map
  const isHidden = ageSeconds > MAP_VISIBILITY_EXPIRY_SEC;

  // Honesty downgrade rule: LIVE_APP older than 2 minutes becomes LAST_REPORTED
  let effectiveSource = originalSource;
  if (originalSource === TrackingSource.LIVE_APP && ageSeconds > LIVE_APP_FRESHNESS_THRESHOLD_SEC) {
    effectiveSource = TrackingSource.LAST_REPORTED;
  }

  return {
    effectiveSource,
    ageSeconds,
    isHidden,
  };
}
