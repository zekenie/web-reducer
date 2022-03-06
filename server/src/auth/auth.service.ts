import jwt from "jsonwebtoken";
import { isUUID } from "class-validator";

export function validateAndDecodeJwt(token: string): {
  isSigned: boolean;
  userId: string;
} {
  const decodedJwt = jwt.decode(token, { complete: true });
  if (!decodedJwt) {
    throw new Error("unable to decode jwt");
  }
  const isUnsigned = decodedJwt.header?.alg === "none";

  if (!isUUID(decodedJwt.payload.sub)) {
    throw new Error("jwt sub is not uuid");
  }

  if (isUnsigned) {
    if (typeof decodedJwt.payload.sub !== "string") {
      throw new Error("invalid jwt subject");
    }
    return { isSigned: false, userId: decodedJwt.payload.sub };
  }

  const payload = jwt.verify(token, process.env.JWT_SECRET!, {
    complete: true,
  });

  return {
    isSigned: true,
    userId: payload.payload.sub as string,
  };
}
