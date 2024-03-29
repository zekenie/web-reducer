import { randomUUID } from "crypto";
import { JsonWebTokenError, sign } from "jsonwebtoken";
import {
  InvalidJwtError,
  InvalidJwtSubError,
  InvalidOrExpiredJwtError,
} from "./auth.errors";
import { validateAndDecodeJwt } from "./auth.service";

process.env.JWT_SECRET = "secret";

function makeSignedJwt(id: string, secret = process.env.JWT_SECRET!) {
  return sign({}, secret, {
    subject: id,
  });
}

describe("auth service", () => {
  let userId: string;

  beforeEach(() => {
    userId = randomUUID();
  });
  describe("validateAndDecodeJwt", () => {
    it("throws with invalid jwt", () => {
      expect(() => validateAndDecodeJwt(userId)).toThrowError(InvalidJwtError);
    });

    it("correctly identifies a signed token", () => {
      const token = makeSignedJwt(userId);
      const auth = validateAndDecodeJwt(token);
      expect(auth.userId).toBe(userId);
    });

    it("errors when the jwt secret is incorrect", () => {
      const token = makeSignedJwt(userId, "wrong secret");
      expect(() => validateAndDecodeJwt(token)).toThrowError(
        InvalidOrExpiredJwtError
      );
    });

    it("errors when the jwt subject is not a uuid", () => {
      const token = makeSignedJwt("foo");
      expect(() => validateAndDecodeJwt(token)).toThrowError(
        InvalidJwtSubError
      );
    });
  });
});
