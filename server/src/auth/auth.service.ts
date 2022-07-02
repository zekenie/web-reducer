import jwt from "jsonwebtoken";
import { isUUID } from "class-validator";
import {
  bulkCreateGuestUsers,
  bulkInsertGuestUserPool,
  countGuestUserPool,
  createUser,
  getUserByEmail,
  getUserById,
  pullFromGuestPool,
} from "../user/user.db";
import { sendMail } from "../email/email.service";
import { mergeAccess } from "../access/access.service";
import { transaction } from "../db";
import {
  InvalidJwtError,
  InvalidJwtSubError,
  InvalidOrExpiredJwtError,
  SignupWithNonGuestHeaderError,
} from "./auth.errors";
import {
  issueSigninTokenToken,
  validateTokenAndGetUserIdThenDeleteToken,
} from "../signin-token/signin-token.service";
import {
  issueRefreshToken,
  validateRefreshToken,
} from "../refresh-token/refresh-token.service";
import { generateToken } from "../token/token.service";
import { bulkCreateHook, createHook } from "../hook/hook.service";
import { bulkCreateNamespaces } from "../secret/secret.remote";
import { enqueue } from "../worker/queue.service";

type Credentials = {
  jwt: string;
  refreshToken: string;
};

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

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!, {
      complete: true,
    });

    return {
      userId: payload.payload.sub as string,
    };
  } catch (e) {
    throw new InvalidOrExpiredJwtError();
  }
}

export async function issueNewCredentialsForRefreshToken({
  token,
  userId,
}: {
  userId: string;
  token: string;
}): Promise<Credentials> {
  await validateRefreshToken({ userId, token });
  return createCredentials(userId);
}

export async function createCredentials(userId: string): Promise<Credentials> {
  const jwtStr = jwt.sign({}, process.env.JWT_SECRET!, {
    subject: userId,
    expiresIn: "1 hour",
    keyid: await generateToken(),
  });
  const refreshToken = await issueRefreshToken({ userId });
  return { jwt: jwtStr, refreshToken };
}

export async function validateTokenAndIssueCredentials(
  signinToken: string
): Promise<Credentials> {
  return transaction(async () => {
    const { userId, guestUserId } =
      await validateTokenAndGetUserIdThenDeleteToken({ token: signinToken });
    await mergeAccess({ oldUserId: guestUserId, newUserId: userId });
    return createCredentials(userId);
  });
}

export async function initiateGuestUserFallback() {
  const user = await createUser();
  await createHook({ userId: user.id });
  return createCredentials(user.id);
}

export async function initiateGuestUser() {
  process.nextTick(async () => {
    const count = await countGuestUserPool();
    if (count < Number(process.env.TARGET_GUEST_POOL_SIZE!)) {
      await enqueue({
        name: "bulk-create-guest-users",
        input: {},
      });
    }
  });
  const userId = await pullFromGuestPool();
  if (!userId) {
    return initiateGuestUserFallback();
  }
  return createCredentials(userId);
}

export async function bulkInitiateGuestUsers({ n }: { n: number }) {
  transaction(async () => {
    const [userIds, namespaceAccessKeys] = await Promise.all([
      bulkCreateGuestUsers({ n }),
      bulkCreateNamespaces({ n }),
    ]);

    await Promise.all([
      bulkCreateHook({
        userIds,
        secretNamespaceAccessKeys: namespaceAccessKeys,
      }),
      bulkInsertGuestUserPool({ userIds }),
    ]);
  });
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
  const signinToken = await issueSigninTokenToken({
    userId: userIdToSignin,
    guestUserId,
  });

  // send user an email
  await sendMail({
    to: email,
    from: "zeke@webreducer.dev",
    locals: { domain: process.env.CLIENT_URL!, token: signinToken },
    name: "signin",
  });
}
