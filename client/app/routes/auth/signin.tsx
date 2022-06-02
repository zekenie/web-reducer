import type { ActionFunction } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import buildClientForJwt from "~/remote/index.server";

export const action: ActionFunction = async ({ context, params, request }) => {
  const client = buildClientForJwt(context.creds.jwt);
  const body = await request.formData();
  await client.auth.signin({ email: body.get("email") as string });
  return redirect(`/auth/signin-thanks`);
};
