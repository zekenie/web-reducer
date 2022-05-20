export class NamespaceNotFoundError extends Error {
  status: 404 = 404;
  constructor() {
    super("Invalid namespace access key");
  }
}
