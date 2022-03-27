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

export async function mergeAccess({
  oldUserId,
  newUserId,
}: {
  oldUserId: string;
  newUserId: string;
}) {
  await db.mergeAccess({ oldUserId, newUserId });
}
