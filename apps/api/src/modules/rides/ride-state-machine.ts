import { RideStatus, ActorType, isAllowedTransition } from '@bao-bao/shared';
import { ConflictException } from '@nestjs/common';

// Custom exception for invalid ride state transitions
export class InvalidTransitionError extends ConflictException {
  constructor(from: RideStatus, to: RideStatus, actor: ActorType) {
    super({
      statusCode: 409,
      code: 'RIDE_INVALID_TRANSITION',
      message: `Invalid transition from ${from} to ${to} for actor ${actor}`,
    });
  }
}

// State machine for ride status transitions
export class RideStateMachine {
  private currentStatus: RideStatus;

  // Initialize with starting status
  constructor(initialStatus: RideStatus = RideStatus.REQUESTED) {
    this.currentStatus = initialStatus;
  }

  // Get current ride status
  public getStatus(): RideStatus {
    return this.currentStatus;
  }

  // Check if transition is allowed for actor
  public canTransition(to: RideStatus, actor: ActorType): boolean {
    return isAllowedTransition(this.currentStatus, to, actor);
  }

  /**
   * Performs a state transition if valid, otherwise throws an error.
   * @param to - The target ride status
   * @param actor - The type of actor attempting the transition
   * @returns The new current status after transition
   * @throws InvalidTransitionError if the transition is not allowed
   */
  public transition(to: RideStatus, actor: ActorType): RideStatus {
    if (!this.canTransition(to, actor)) {
      throw new InvalidTransitionError(this.currentStatus, to, actor);
    }
    this.currentStatus = to;
    return this.currentStatus;
  }

  /**
   * Static method to validate a transition without mutating state.
   * Useful for validation checks before committing to a transition.
   * @param from - The source ride status
   * @param to - The target ride status
   * @param actor - The type of actor attempting the transition
   * @throws InvalidTransitionError if the transition is not allowed
   */
  public static validate(from: RideStatus, to: RideStatus, actor: ActorType): void {
    if (!isAllowedTransition(from, to, actor)) {
      throw new InvalidTransitionError(from, to, actor);
    }
  }
}
