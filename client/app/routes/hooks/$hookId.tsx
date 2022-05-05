import { MenuIcon } from "@heroicons/react/outline";
import type { LoaderFunction } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import EditorAndFooter from "~/components/hook/editor";
import ResourceBar from "~/components/hook/resource-bar";
import { Tab, Tabs } from "~/components/tabs";
import type { HookDetail } from "~/remote/hook-client.server";
import buildClientForJwt from "~/remote/index.server";

export const loader: LoaderFunction = async ({ context, params }) => {
  const client = buildClientForJwt(context.creds.jwt);

  return client.hooks.detail(params.hookId!);
};

export default function Hook() {
  const hook = useLoaderData<HookDetail>();

  return (
    <>
      <header className="px-3 flex-shrink-0 py-3 border-b grid grid-cols-3">
        <div className="flex flex-row items-center space-x-4">
          <button
            // onClick={() =>
            //   pushModal({ name: "confirm", props: { text: "foo", faz: "sdf" } })
            // }
            className="p-3 hover:bg-canvas-50 rounded-full"
          >
            <MenuIcon className="w-7 h-7 self-center" />
          </button>

          <img className="w-56" alt="Hook Reducer" src="/logo.svg" />
        </div>
        <div className="flex items-center justify-center">
          <ResourceBar hook={hook} />
        </div>
        <div />
      </header>
      <section className="flex-grow grid grid-cols-2 overflow-hidden">
        <EditorAndFooter hook={hook} />

        <div className="border-l flex-grow flex-col flex flex-shrink-0 overflow-hidden">
          <Tabs>
            <Tab end to={`/hooks/${hook.id}`}>
              Requests
            </Tab>
            <Tab to="./secrets">Secrets</Tab>
            <Tab to="./keys">Keys</Tab>
          </Tabs>

          <div className="overflow-y-scroll flex flex-col flex-1 flex-grow p-2">
            <Outlet />
          </div>
        </div>
      </section>
    </>
  );
}
