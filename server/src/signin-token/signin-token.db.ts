import { sql } from "slonik";
import { getPool } from "../db";
import { nanoid } from "nanoid";

export async function createSigninToken({
  userId,
  guestUserId,
}: {
  userId: string;
  guestUserId: string;
}): Promise<string> {
  const token = nanoid();
  await getPool().any(sql`
    insert into "signinToken"
    ("userId", "guestUserId", "token", "createdAt")
    values
    (${userId}, ${guestUserId}, ${token}, NOW())
  `);

  return token;
}

export async function validateTokenAndGetUserIdThenDeleteToken(
  token: string
): Promise<{ userId: string; guestUserId: string }> {
  const res = await getPool().maybeOne<{
    userId: string;
    guestUserId: string;
  }>(sql`
      update "signinToken"
      set "validatedAt" = NOW()
      where token = ${token}
      and NOW() - "createdAt" < "1 hour"::interval
      returning "userId", "guestUserId"
    `);
  if (!res) {
    throw new Error(`token ${token} is no longer valid`);
  }
  await getPool().any(sql`
      insert into "singin"
      ("userId", "token", "createdAt")
      values
      (${res.userId}, ${token}, NOW())
    `);
  return res;
}
