export class InvalidRefreshTokenError extends Error {
  status: number = 400;
  constructor() {
    super("Invalid refresh token");
  }
}
