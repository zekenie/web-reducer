import type { LoaderFunction } from "@remix-run/server-runtime";
import buildClientForJwt from "~/remote/index.server";

export const loader: LoaderFunction = async ({ context, params, request }) => {
  const client = buildClientForJwt(context.creds.jwt);

  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  return {
    siteUrl: process.env.SITE_URL,
    history: await client.hooks.history(params.hookId!, {
      token: token || undefined,
    }),
  };
};
