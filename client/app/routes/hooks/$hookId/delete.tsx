import type { ActionFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import buildClientForJwt from "~/remote/index.server";

export const action: ActionFunction = async ({ context, request, params }) => {
  const client = buildClientForJwt(context.creds.jwt);
  await client.hooks.delete(params.hookId!);
  return redirect("/");
};
