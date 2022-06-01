import { getUserById } from "./user.db";
import { UserDetails } from "./user.types";

export async function getUserDetails({
  userId,
}: {
  userId: string;
}): Promise<UserDetails> {
  const user = await getUserById(userId);
  return { ...user, workflowState: user.email ? "user" : "guest" };
}
