import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import buildClientForJwt from "~/remote/index.server";

export const action: ActionFunction = async ({ context, request, params }) => {
  const client = buildClientForJwt(context.creds.jwt);
  const body = await request.formData();
  await client.hooks.deleteKey({
    id: body.get("hookId") as string,
    key: body.get("key") as string,
  });
  return json({});
};
