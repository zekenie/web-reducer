/**
 * This method is used to merge a visitor (unauthed user) into a user account
 * - Merges access
 */
export async function absorbUnauthenticatedAccount({
  userId,
  visitorId,
}: {
  userId: string;
  visitorId: string;
}): Promise<void> {
  // start transaction
  // assign access from visitor to user
  // lock visitor
}
