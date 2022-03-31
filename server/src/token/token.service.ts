import { nanoid } from "nanoid/async";
import { createHash } from "crypto";

export async function generateToken(chars: number = 21): Promise<string> {
  return nanoid(chars);
}

export function hashToken(token: string): string {
  const hash = createHash("sha1");
  hash.update(token, "utf-8");
  return hash.digest("hex");
}
