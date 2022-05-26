export class SecretsError extends Error {
  status: number = 500;
  body: unknown;
  constructor(body: unknown) {
    super("secrets error");
    this.body = body;
  }
}
