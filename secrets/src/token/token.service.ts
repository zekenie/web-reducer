import { nanoid } from "nanoid/async";

export async function generateToken(chars: number = 21): Promise<string> {
  return nanoid(chars);
}
