import type { ActionFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { parseAuthCookie } from "~/auth/creds-cookie.server";

export const action: ActionFunction = async ({ request }) => {
  const { client } = await parseAuthCookie(request.headers.get("Cookie"));
  await client.hooks.createHook();
  return redirect("/");
};
