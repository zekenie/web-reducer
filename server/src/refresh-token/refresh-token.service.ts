import { generateToken, hashToken } from "../token/token.service";
import { isTokenHashValid, saveRefreshToken } from "./refresh-token.db";
import { InvalidRefreshTokenError } from "./refresh-token.errors";

export async function issueRefreshToken({
  userId,
}: {
  userId: string;
}): Promise<string> {
  const token = await generateToken(32);
  const hash = hashToken(token);
  await saveRefreshToken({ tokenHash: hash, userId });
  return token;
}

export async function validateRefreshToken({
  userId,
  token,
}: {
  userId: string;
  token: string;
}): Promise<void> {
  const hash = hashToken(token);
  const valid = await isTokenHashValid({ tokenHash: hash, userId });
  if (!valid) {
    throw new InvalidRefreshTokenError();
  }
}
