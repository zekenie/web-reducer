export class MissingKeyParamError extends Error {
  status = 400;
  constructor() {
    super("Missing key param");
  }
}

export class InvalidKeyParamError extends Error {
  status = 400;
  constructor() {
    super("Invalid key param");
  }
}
