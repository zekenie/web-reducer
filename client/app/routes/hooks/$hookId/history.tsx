import { LoaderFunction } from "@remix-run/server-runtime";
import buildClientForJwt from "~/remote/index.server";

export const loader: LoaderFunction = async ({ context, params }) => {
  const client = buildClientForJwt(context.creds.jwt);

  return {
    siteUrl: process.env.SITE_URL,
    history: await client.hooks.history(params.hookId!),
  };
};
