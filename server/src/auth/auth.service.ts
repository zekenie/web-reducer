import jwt from "jsonwebtoken";
import { isUUID } from "class-validator";
import { createUser, getUserByEmail } from "../user/user.db";
import { createSigninToken } from "../signin-token/signin-token.db";
import { sendMail } from "../email/email.service";
import { validateTokenAndGetUserIdThenDeleteToken as validateTokenAndGetUserIdThenDeleteTokenDb } from "../signin-token/signin-token.db";

export function validateAndDecodeJwt(token: string): {
  isSignedIn: boolean;
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
    return { isSignedIn: false, userId: decodedJwt.payload.sub };
  }

  const payload = jwt.verify(token, process.env.JWT_SECRET!, {
    complete: true,
  });

  return {
    isSignedIn: true,
    userId: payload.payload.sub as string,
  };
}

export function signJwt(userId: string): string {
  return jwt.sign({}, process.env.JWT_SECRET!, {
    subject: userId,
  });
}

export async function validateTokenAndSignJwt(
  signinToken: string
): Promise<string> {
  const userId = await validateTokenAndGetUserIdThenDeleteTokenDb(signinToken);
  return signJwt(userId);
}

export async function initiateSignin(email: string) {
  const user = await getUserByEmail(email);

  let userIdToSignin: string;
  if (!user) {
    const { id } = await createUser(email);
    userIdToSignin = id;
  } else {
    userIdToSignin = user.id;
  }
  // if no user, create user
  // create signin token
  const signinToken = await createSigninToken(userIdToSignin);

  // send user an email
  await sendMail({
    to: email,
    from: "zeke@webreducer.dev",
    locals: { link: `webreeducer.com/${signinToken}` },
    name: "signin",
  });
}
