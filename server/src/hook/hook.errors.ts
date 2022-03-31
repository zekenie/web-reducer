export class CodeNotFoundForWriteKeyError extends Error {
  status: number = 404;
  constructor() {
    super("No code found for write key");
  }
}
