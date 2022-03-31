import { sql } from "slonik";
import { getPool } from "../db";
import { ExpiredSigninTokenError } from "../auth/auth.errors";

export async function createSigninToken({
  userId,
  guestUserId,
  tokenHash,
}: {
  userId: string;
  tokenHash: string;
  guestUserId: string;
}): Promise<void> {
  await getPool().any(sql`
    insert into "signinToken"
    ("userId", "guestUserId", "token", "createdAt")
    values
    (${userId}, ${guestUserId}, ${tokenHash}, NOW())
  `);
}

export async function validateTokenAndGetUserIdThenDeleteToken(
  tokenHash: string
): Promise<{ userId: string; guestUserId: string }> {
  const res = await getPool().maybeOne<{
    userId: string;
    guestUserId: string;
  }>(sql`
      delete from "signinToken"
      where token = ${tokenHash}
      and NOW() - "createdAt" < '1 hour'::interval
      returning "userId", "guestUserId"
    `);
  if (!res) {
    throw new ExpiredSigninTokenError();
  }
  await getPool().any(sql`
      insert into "signin"
      ("userId", "token", "createdAt")
      values
      (${res.userId}, ${tokenHash}, NOW())
    `);
  return res;
}
