import { generateToken, hashToken } from "../token/token.service";
import * as db from "./signin-token.db";

export async function issueSigninTokenToken({
  userId,
  guestUserId,
}: {
  userId: string;
  guestUserId: string;
}): Promise<string> {
  const token = await generateToken(32);
  const hash = hashToken(token);
  await db.createSigninToken({ tokenHash: hash, userId, guestUserId });
  return token;
}

export async function validateTokenAndGetUserIdThenDeleteToken({
  token,
}: {
  token: string;
}): Promise<{ userId: string; guestUserId: string }> {
  const hash = hashToken(token);
  return db.validateTokenAndGetUserIdThenDeleteToken(hash);
}
