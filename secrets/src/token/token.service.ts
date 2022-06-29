import { nanoid } from "nanoid/async";
import os from "os";
import Bluebird from "bluebird";

export async function generateToken(chars: number = 21): Promise<string> {
  return nanoid(chars);
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
