export class CodeNotFoundForWriteKeyError extends Error {
  status: number = 404;
  constructor() {
    super("No code found for write key");
  }
}

export class CodeNotFoundForReadKeyError extends Error {
  status: number = 404;
  constructor() {
    super("No code found for write key");
  }
}

export class NameCollisionError extends Error {
  status: number = 500;
  constructor() {
    super("Unable to generate unique name");
  }
}
