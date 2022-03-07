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

export async function createUser(email: string): Promise<User> {
  const user = await getPool().one<User>(sql`
    insert into "user"
    (email)
    values
    (${email.toLowerCase()})
    returning id, email
  `);

  return user;
}
