export class NotProposerError extends Error {
  constructor() {
    super("Only the ride's proposer can do this")
    this.name = "NotProposerError"
  }
}
