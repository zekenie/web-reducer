export class RunnerError extends Error {
  status: number = 500;
  body: unknown;
  constructor(body: unknown) {
    super("runner error");
    this.body = body;
  }
}
