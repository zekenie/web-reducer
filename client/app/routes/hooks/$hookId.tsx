import { MenuIcon } from "@heroicons/react/outline";
import type { LoaderFunction } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { InsideHeader } from "~/components/header";
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
      <InsideHeader>
        <ResourceBar hook={hook} />
      </InsideHeader>
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

          <div className="overflow-y-scroll flex flex-col flex-1 flex-grow">
            <Outlet context={{ hook }} />
          </div>
        </div>
      </section>
    </>
  );
}
