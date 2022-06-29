export class NamespaceNotFoundError extends Error {
  status: 404 = 404;
  constructor() {
    super("Invalid namespace access key");
  }
}

export class InvalidBulkNamespaceBody extends Error {
  status: 400 = 400;
  constructor() {
    super("Invalid bulk namespace body");
  }
}
