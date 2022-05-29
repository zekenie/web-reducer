import type { LoaderFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useModals } from "~/modals/lib/modal-provider";
import type { HookOverview } from "~/remote/hook-client.server";
import buildClientForJwt from "~/remote/index.server";

export const loader: LoaderFunction = async ({ context }) => {
  const client = buildClientForJwt(context.creds.jwt);

  return client.hooks.list();
};

export default function Index() {
  const hooks = useLoaderData<HookOverview[]>();
  const { pushModal } = useModals();
  return (
    <>
      <h1>Hook ids</h1>
      <button
        onClick={() => pushModal({ name: "test", props: { text: "foo" } })}
      >
        open modal
      </button>
      <ul>
        {hooks.map((hook) => (
          <li key={hook.id}>
            <Link to={`/hooks/${hook.id}`}>{hook.name}</Link>
          </li>
        ))}
      </ul>
      <form method="post" action="/hooks/create">
        <button type="submit">Create hook</button>
      </form>
    </>
  );
}
