import { sql } from "slonik";
import { getPool } from "../db";

export async function saveRefreshToken({
  tokenHash,
  userId,
}: {
  tokenHash: string;
  userId: string;
}): Promise<void> {
  await getPool().any(sql`
    insert into "refreshToken"
    ("userId", "token", "createdAt")
    values
    (${userId}, ${tokenHash}, NOW())
  `);
}

export async function isTokenHashValid({
  tokenHash,
  userId,
}: {
  tokenHash: string;
  userId: string;
}): Promise<boolean> {
  const token = await getPool().maybeOne(sql`
    delete from "refreshToken"
    where token = ${tokenHash}
    and "userId" = ${userId}
    and NOW() - "createdAt" < '7 days'::interval
    returning id
  `);
  return !!token;
}
