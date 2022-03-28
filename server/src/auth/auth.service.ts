import jwt from "jsonwebtoken";
import { isUUID } from "class-validator";
import { createUser, getUserByEmail, getUserById } from "../user/user.db";
import { createSigninToken } from "../signin-token/signin-token.db";
import { sendMail } from "../email/email.service";
import { validateTokenAndGetUserIdThenDeleteToken as validateTokenAndGetUserIdThenDeleteTokenDb } from "../signin-token/signin-token.db";
import { mergeAccess } from "../access/access.service";
import { transaction } from "../db";
import {
  InvalidJwtError,
  InvalidJwtSubError,
  SignupWithNonGuestHeaderError,
} from "./auth.errors";

export function validateAndDecodeJwt(token: string): {
  userId: string;
} {
  const decodedJwt = jwt.decode(token, { complete: true });
  if (!decodedJwt) {
    throw new InvalidJwtError();
  }

  if (!isUUID(decodedJwt.payload.sub)) {
    throw new InvalidJwtSubError();
  }

  const payload = jwt.verify(token, process.env.JWT_SECRET!, {
    complete: true,
  });

  return {
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
  return transaction(async () => {
    const { userId, guestUserId } =
      await validateTokenAndGetUserIdThenDeleteTokenDb(signinToken);
    await mergeAccess({ oldUserId: guestUserId, newUserId: userId });
    return signJwt(userId);
  });
}

export async function initiateGuestUser() {
  const user = await createUser();
  return signJwt(user.id);
}

export async function initiateSignin({
  email,
  guestUserId,
}: {
  email: string;
  guestUserId: string;
}) {
  const [user, sessionUser] = await Promise.all([
    getUserByEmail(email),
    getUserById(guestUserId),
  ]);

  if (sessionUser.email) {
    throw new SignupWithNonGuestHeaderError();
  }

  let userIdToSignin: string;
  if (!user) {
    const { id } = await createUser(email);
    userIdToSignin = id;
  } else {
    userIdToSignin = user.id;
  }
  // if no user, create user
  // create signin token
  const signinToken = await createSigninToken({
    userId: userIdToSignin,
    guestUserId,
  });

  // send user an email
  await sendMail({
    to: email,
    from: "zeke@webreducer.dev",
    locals: { link: `webreeducer.com/${signinToken}` },
    name: "signin",
  });
}
