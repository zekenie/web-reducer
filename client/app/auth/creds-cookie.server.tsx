import { createCookie } from "@remix-run/node";
import type { Credentials } from "~/remote/auth-client.server";
import buildClientForJwt from "~/remote/index.server";

export const credsCookie = createCookie("creds", {
  // todo
});

export async function parseAuthCookie(cookie: string | null) {
  const creds: Partial<Credentials> = (await credsCookie.parse(cookie)) || {};
  return { creds, client: buildClientForJwt(creds.jwt) };
}
