import type { LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import buildClientForJwt from "~/remote/index.server";

export const loader: LoaderFunction = async ({ context, params }) => {
  const client = buildClientForJwt(context.creds.jwt);

  const newCreds = await client.auth.validateSigninToken({
    token: params.token!,
  });

  context.setCreds(newCreds);

  return redirect("/");
};
