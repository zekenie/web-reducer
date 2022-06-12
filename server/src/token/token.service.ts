import { nanoid } from "nanoid/async";
import { sha256 } from "../crypto/crypto.service";

export async function generateToken(chars: number = 21): Promise<string> {
  return nanoid(chars);
}

export function hashToken(token: string): string {
  return sha256(token);
}
