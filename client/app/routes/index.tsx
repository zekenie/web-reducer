import type { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useModals } from "~/modals/ModalProvider";
import type { HookOverview } from "~/remote/hook-client.server";
import buildClientForJwt from "~/remote/index.server";

export const loader: LoaderFunction = async ({ context }) => {
  const client = buildClientForJwt(context.creds.jwt);

  return client.hooks.listHooks();
};

export default function Index() {
  const hooks = useLoaderData<HookOverview[]>();
  const { pushModal } = useModals();
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Hook ids</h1>
      <button
        onClick={() => pushModal({ name: "test", props: { text: "foo" } })}
      >
        open modal
      </button>
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
