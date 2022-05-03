import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import buildClientForJwt from "~/remote/index.server";

export const action: ActionFunction = async ({ context, request, params }) => {
  const client = buildClientForJwt(context.creds.jwt);
  await client.hooks.publish({
    id: params.hookId!,
  });
  return json({});
};
