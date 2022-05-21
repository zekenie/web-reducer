export class MissingKeyParamError extends Error {
  status = 400;
  constructor(param: string) {
    super(`Missing key param: ${param}`);
  }
}

export class InvalidKeyParamError extends Error {
  status = 400;
  constructor(param: string) {
    super(`Invalid key param: ${param}`);
  }
}
