import { sql } from "slonik";
import { getPool } from "../db";
import { User } from "./user.types";

export async function getUserByEmail(email: string): Promise<User | null> {
  const user = await getPool().maybeOne<User>(sql`
    select id, email
    from "user"
    where email = ${email.toLowerCase()}
  `);

  return user;
}

export async function getUserById(id: string): Promise<User> {
  const user = await getPool().one<User>(sql`
    select id, email
    from "user"
    where id = ${id}
  `);

  return user;
}

export async function createUser(email?: string): Promise<User> {
  const user = await getPool().one<User>(sql`
    insert into "user"
    (email)
    values
    (${email ? email.toLowerCase() : null})
    returning id, email
  `);

  return user;
}

export async function bulkCreateGuestUsers({ n }: { n: number }) {
  const users = await getPool().query<{ id: string }>(sql`
    insert into "user"
    (email)
    select * from ${sql.unnest(
      Array.from({ length: n })
        .fill(null)
        .map(() => [null]),
      ["varchar"]
    )}
    returning id
  `);
  return users.rows.map((u) => u.id);
}

export async function pullFromGuestPool(): Promise<string | undefined> {
  const row = await getPool().maybeOne<{ userId: string }>(sql`
    delete from "guestUserPool"
    where id in (select id from "guestUserPool" limit 1)
    returning "userId"
  `);

  return row?.userId;
}

export async function countGuestUserPool(): Promise<number> {
  const { count } = await getPool().one<{ count: number }>(sql`
    select count(*) from "guestUserPool"
  `);

  return count;
}

export async function bulkInsertGuestUserPool({
  userIds,
}: {
  userIds: string[];
}) {
  await getPool().query<{ id: string }>(sql`
    insert into "guestUserPool"
    ("userId")
    select * from ${sql.unnest(
      userIds.map((u) => [u]),
      ["uuid"]
    )}
  `);
}
