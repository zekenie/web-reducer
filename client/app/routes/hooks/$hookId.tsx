import { XIcon } from "@heroicons/react/outline";
import type { LoaderFunction } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { createContext, useCallback, useMemo, useState } from "react";
import { InsideHeader } from "~/components/header";
import EditorAndFooter from "~/components/hook/editor";
import ResourceBar from "~/components/hook/resource-bar";
import { Tab, Tabs } from "~/components/tabs";
import type { HookDetail } from "~/remote/hook-client.server";
import buildClientForJwt from "~/remote/index.server";
import Docs from "../../content/docs.mdx";

export const loader: LoaderFunction = async ({ context, params }) => {
  const client = buildClientForJwt(context.creds.jwt);

  return client.hooks.detail(params.hookId!);
};

export const docsContext = createContext<{
  openDocs: () => void;
  closeDocs: () => void;
}>({
  openDocs() {},
  closeDocs() {},
});

export default function Hook() {
  const hook = useLoaderData<HookDetail>();

  const [requestCount, setRequestCount] = useState(hook.requestCount);

  const [areDocsOpen, setDocsOpen] = useState(false);
  const openDocs = useCallback(() => {
    setDocsOpen(true);
  }, []);
  const closeDocs = useCallback(() => {
    setDocsOpen(false);
  }, []);

  const mainColWidthClass = useMemo(
    () => (areDocsOpen ? "col-span-4" : "col-span-5"),
    [areDocsOpen]
  );

  return (
    <>
      <InsideHeader>
        <ResourceBar requestCount={requestCount} hook={hook} />
      </InsideHeader>
      <docsContext.Provider value={{ openDocs, closeDocs }}>
        <section className="flex-grow grid grid-cols-10 overflow-hidden ">
          <div className={`${mainColWidthClass} flex-grow flex flex-col`}>
            <EditorAndFooter hook={hook} />
          </div>

          <div
            className={`border-l ${mainColWidthClass} flex-grow flex-col flex flex-shrink-0 overflow-hidden`}
          >
            <Tabs>
              <Tab end to={`/hooks/${hook.id}`}>
                Requests
              </Tab>
              <Tab to="./secrets">Secrets</Tab>
              <Tab data-tour-id="keys-link" to="./keys">
                Keys
              </Tab>
            </Tabs>

            <div className="overflow-y-scroll flex flex-col flex-1 flex-grow">
              <Outlet context={{ hook, setRequestCount }} />
            </div>
          </div>
          {areDocsOpen && (
            <div className="border-l col-span-2 overflow-y-scroll flex flex-col flex-1 flex-grow">
              <div className="sticky h-9 top-0 border-b bg-slate-100 flex flex-row justify-between items-center px-2 py-3">
                <h3 className="text-xs font-bold">Docs</h3>
                <button
                  onClick={closeDocs}
                  className="hover:bg-canvas-200 rounded-full p-0.5"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              </div>
              <div className="leading-tight docs bg-slate-50 p-2 flex-1 prose-sm text-clip overflow-x-clip prose-a:font-semibold prose-a:underline">
                <Docs />
              </div>
            </div>
          )}
        </section>
      </docsContext.Provider>
    </>
  );
}
