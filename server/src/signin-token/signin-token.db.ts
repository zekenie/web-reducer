import { sql } from "slonik";
import { getPool } from "../db";
import { nanoid } from "nanoid";

export async function createSigninToken(userId: string): Promise<string> {
  const token = nanoid();
  await getPool().any(sql`
    insert into "signinToken"
    ("userId", "token", "createdAt")
    values
    (${userId}, ${token}, NOW())
  `);

  return token;
}

export async function validateTokenAndGetUserIdThenDeleteToken(
  token: string
): Promise<string> {
  const res = await getPool().maybeOne<{ userId: string }>(sql`
    update "signinToken"
    set "validatedAt" = NOW()
    where token = ${token}
    and NOW() - "createdAt" < "1 hour"::interval
    returning "userId"
  `);
  if (res) {
    return res.userId;
  }
  throw new Error(`token ${token} is no longer valid`);
}
