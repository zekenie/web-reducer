import type { LoaderFunction } from "@remix-run/node";
import {
  Link,
  useLoaderData,
  useNavigate,
  useOutletContext,
} from "@remix-run/react";
import { useEffect } from "react";
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
    <>
      <h1>Hook ids</h1>
      {/* <button
        onClick={() => pushModal({ name: "test", props: { text: "foo" } })}
      >
        open modal
      </button> */}
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
