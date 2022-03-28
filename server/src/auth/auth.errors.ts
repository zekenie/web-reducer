export class SignupWithNonGuestHeaderError extends Error {
  status: number = 403;
  constructor() {
    super(
      "Auth header for current user is a fully registered user and cannot sign in. You can only sign in with a guest account"
    );
  }
}

export class InvalidJwtError extends Error {
  status: number = 400;
  constructor() {
    super("Unable to decode jwt");
  }
}

export class InvalidJwtSubError extends Error {
  status: number = 400;
  constructor() {
    super("Jwt subject is not a valid UUID");
  }
}
