import { InboxInIcon, KeyIcon, PlusIcon } from "@heroicons/react/outline";
import type { LoaderFunction } from "@remix-run/node";
import {
  Link,
  useLoaderData,
  useNavigate,
  useOutletContext,
} from "@remix-run/react";
import { Button } from "flowbite-react";
import { useEffect } from "react";
import { formatNumber } from "~/components/hook/resource-bar";
import type { UserDetails } from "~/remote/auth-client.server";
import type { HookOverview } from "~/remote/hook-client.server";
import buildClientForJwt from "~/remote/index.server";

export const loader: LoaderFunction = async ({ context }) => {
  const client = buildClientForJwt(context.creds.jwt);

  const list = await client.hooks.list();
  return list;
};

export default function Index() {
  const hooks = useLoaderData<HookOverview[]>();
  const navigate = useNavigate();
  const { userDetails } = useOutletContext<{ userDetails: UserDetails }>();
  useEffect(() => {
    if (userDetails.workflowState === "guest") {
      const [hook] = hooks;
      navigate(`/hooks/${hook.id}`);
    }
  }, [userDetails, hooks, navigate]);
  if (userDetails.workflowState === "guest") {
    return null;
  }
  return (
    <div className="mx-auto max-w-xl w-full mt-12 space-y-6">
      <div className="border rounded divide-y">
        {hooks.map((hook) => (
          <Link
            className="hover:bg-canvas-50 p-2 flex flex-row items-center"
            key={hook.id}
            to={`/hooks/${hook.id}`}
          >
            <div>
              <h2>{hook.name}</h2>
              <p className="text-canvas-700 text-sm">{hook.description}</p>
            </div>
            <div className="flex-1" />
            <div>
              <div className="flex border items-center space-x-1 flex-row text-canvas-400 px-2 p-1 rounded text-xs font-bold">
                <InboxInIcon className="w-4 h-4 self-center" />
                <div className="self-center">
                  {formatNumber(hook.requestCount)}
                </div>
              </div>
              {/* <div className="flex border items-center space-x-1 flex-row text-canvas-400 px-2 p-1 rounded text-xs font-bold">
                <KeyIcon className="w-4 h-4 self-center" />
                <div className="self-center">
                  {hook.readKeys.length + hook.writeKeys.length}
                </div>
              </div> */}
            </div>
          </Link>
        ))}
      </div>
      <form
        method="post"
        className="flex flex-row justify-center"
        action="/hooks/create"
      >
        <Button color="green" size="lg" type="submit" pill icon={PlusIcon} />
      </form>
    </div>
  );
}
