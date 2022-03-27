import { sql } from "slonik";
import { getPool } from "../db";

export async function hasAccess({
  userId,
  hookId,
}: {
  userId: string;
  hookId: string;
}): Promise<boolean> {
  const pool = getPool();
  const { count } = await pool.one<{ count: string }>(sql`
    select count(*) from "access"
    where "userId" = ${userId}
      and "hookId" = ${hookId}
  `);

  return Number(count) > 0;
}

export async function mergeAccess({
  oldUserId,
  newUserId,
}: {
  oldUserId: string;
  newUserId: string;
}) {
  await getPool().any(sql`
    update "access"
    set "userId" = ${newUserId}
    where "userId" = ${oldUserId}
  `);
}

export async function provisionAccess({
  userId,
  hookId,
}: {
  userId: string;
  hookId: string;
}) {
  // const pool = getPool();
  // await pool.query(sql`
  //   insert into "access"
  //   ("hookId", "userId")
  //   values
  //   (${hookId}, ${userId})
  // `);
}
