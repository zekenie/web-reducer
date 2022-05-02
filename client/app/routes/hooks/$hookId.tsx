import { MenuIcon } from "@heroicons/react/outline";
import type { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import ResourceBar from "~/components/resource-bar";
import type { HookDetail } from "~/remote/hook-client.server";
import buildClientForJwt from "~/remote/index.server";

export const loader: LoaderFunction = async ({ context, params }) => {
  const client = buildClientForJwt(context.creds.jwt);

  return client.hooks.getHook(params.hookId!);
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
        <div className="flex-grow">
          {/* <Editor
            options={{
              fontSize: "16px",
              minimap: { enabled: false },
            }}
            defaultLanguage="javascript"
            defaultValue={exampleCode}
          /> */}
        </div>

        <div className="border-l flex-grow flex-col flex flex-shrink-0 overflow-hidden">
          {/* <Tabs>
            <Tab selected>Requests</Tab>
            <Tab>State</Tab>
            <Tab>Secrets</Tab>
            <Tab>Keys</Tab>
            <Tab>Config</Tab>
            <Tab>Docs</Tab>
          </Tabs>
          <div className="overflow-y-scroll flex-grow">
            <Requests />
          </div> */}
        </div>
      </section>
    </>
  );
}
