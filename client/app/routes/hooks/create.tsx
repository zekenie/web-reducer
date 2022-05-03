import type { ActionFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import buildClientForJwt from "~/remote/index.server";

export const action: ActionFunction = async ({ context }) => {
  const client = buildClientForJwt(context.creds.jwt);
  await client.hooks.createHook();
  return redirect("/");
};
