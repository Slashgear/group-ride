export class RideNotFoundError extends Error {
  constructor() {
    super("Ride not found")
    this.name = "RideNotFoundError"
  }
}

export class RideNotActiveError extends Error {
  constructor() {
    super("Ride is not active")
    this.name = "RideNotActiveError"
  }
}

export class AlreadyMemberError extends Error {
  constructor() {
    super("Already a member of this ride")
    this.name = "AlreadyMemberError"
  }
}