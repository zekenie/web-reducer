import { randomUUID } from "crypto";
import { JsonWebTokenError, sign } from "jsonwebtoken";
import { validateAndDecodeJwt } from "./auth.service";

process.env.JWT_SECRET = "secret";

function makeSignedJwt(id: string, secret = process.env.JWT_SECRET!) {
  return sign({}, secret, {
    subject: id,
  });
}

function makeUnsignedToken(id: string) {
  return sign({}, "", {
    subject: id,
    algorithm: "none",
  });
}

describe("auth service", () => {
  let userId: string;

  beforeEach(() => {
    userId = randomUUID();
  });
  describe("validateAndDecodeJwt", () => {
    it("throws with invalid jwt", () => {
      expect(() => validateAndDecodeJwt(userId)).toThrowError(
        "unable to decode jwt"
      );
    });

    it("correctly identifies a signed token", () => {
      const token = makeSignedJwt(userId);
      const auth = validateAndDecodeJwt(token);
      expect(auth.isSignedIn).toBe(true);
      expect(auth.userId).toBe(userId);
    });

    it("correctly identifies an unsigned token", () => {
      const token = makeUnsignedToken(userId);
      const auth = validateAndDecodeJwt(token);
      expect(auth.isSignedIn).toBe(false);
      expect(auth.userId).toBe(userId);
    });

    it("errors when the jwt secret is incorrect", () => {
      const token = makeSignedJwt(userId, "wrong secret");
      expect(() => validateAndDecodeJwt(token)).toThrowError(JsonWebTokenError);
    });

    it("errors when the jwt subject is not a uuid", () => {
      const token = makeSignedJwt("foo");
      expect(() => validateAndDecodeJwt(token)).toThrowError(
        "jwt sub is not uuid"
      );
    });
  });
});
