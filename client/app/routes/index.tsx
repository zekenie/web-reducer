import type { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { parseAuthCookie } from "~/auth/creds-cookie.server";
import type { HookOverview } from "~/remote/hook-client.server";

export const loader: LoaderFunction = async ({ request }) => {
  const { client } = await parseAuthCookie(request.headers.get("Cookie"));
  return client.hooks.listHooks();
};

export default function Index() {
  const hooks = useLoaderData<HookOverview[]>();
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Hook ids</h1>
      <ul>
        {hooks.map((hook) => (
          <li key={hook.id}>{hook.id}</li>
        ))}
      </ul>
      <form method="post" action="/hooks">
        <button type="submit">Create hook</button>
      </form>
    </div>
  );
}
