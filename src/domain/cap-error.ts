export class CapConflictError extends Error {
  constructor() {
    super("New cap is lower than the current confirmed participant count")
    this.name = "CapConflictError"
  }
}
