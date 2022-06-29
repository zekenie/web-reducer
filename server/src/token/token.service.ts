import { nanoid } from "nanoid/async";
import { sha256 } from "../crypto/crypto.service";
import Bluebird from "bluebird";
import os from "os";

export async function generateToken(chars: number = 21): Promise<string> {
  return nanoid(chars);
}

export function hashToken(token: string): string {
  return sha256(token);
}

export async function bulkGenerateTokens(
  n: number,
  chars: number = 21
): Promise<string[]> {
  return Bluebird.map(
    Array.from({ length: n * 2 }).fill(null),
    () => generateToken(),
    { concurrency: os.cpus().length }
  );
}
