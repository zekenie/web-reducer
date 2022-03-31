export class InvalidWriteKeyError extends Error {
  status: number = 404;

  constructor() {
    super("Invalid writeKey");
  }
}

export class UnableToResolveSettledRequest extends Error {
  status: number = 500;
  constructor(reason: string) {
    super(`unable to resolve settled request: ${reason}`);
  }
}
