import * as db from "./access.db";

export async function hasAccess({
  userId,
  hookId,
}: {
  userId: string;
  hookId: string;
}): Promise<boolean> {
  return db.hasAccess({ hookId, userId });
}
