import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import buildClientForJwt from "~/remote/index.server";

export const action: ActionFunction = async ({ context, request, params }) => {
  const client = buildClientForJwt(context.creds.jwt);
  const body = await request.formData();
  await client.hooks.update({
    id: params.hookId!,
    payload: {
      code: body.get("code") as string | undefined,
      name: body.get("name") as string | undefined,
      description: body.get("description") as string | undefined,
    },
  });
  return json({});
};
