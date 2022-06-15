import { BackspaceIcon, PlusCircleIcon } from "@heroicons/react/outline";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
  useOutletContext,
  useTransition,
} from "@remix-run/react";
import { Button } from "flowbite-react";
import { useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import InfoPanel from "~/components/info-panel";
import { useModals } from "~/modals/lib/modal-provider";
import type { HookDetail } from "~/remote/hook-client.server";
import buildClientForJwt from "~/remote/index.server";

export const loader: LoaderFunction = async ({ context, params }) => {
  const client = buildClientForJwt(context.creds.jwt);

  return {
    secrets: await client.secrets.list({ hookId: params.hookId! }),
  };
};

export const action: ActionFunction = async ({ context, request, params }) => {
  const client = buildClientForJwt(context.creds.jwt);
  const body = await request.formData();
  await client.secrets.set({
    hookId: params.hookId!,
    key: body.get("key") as string,
    value: body.get("value") as string,
  });
  return json({ success: true });
};

const SecretRow = ({
  keyStr,
  valueStr,
  hookId,
}: {
  keyStr: string;
  valueStr: string;
  hookId: string;
}) => {
  const transition = useTransition();
  const fetcher = useFetcher();

  const { pushModal } = useModals();
  const deleteSecret = useCallback(async () => {
    const confirmed = await pushModal({
      name: "confirm",
      props: {
        title: `Confirm deleting ${keyStr}`,
        body: "This secret value cannot be recovered. When you delete a secret, old requests are not re-processed. This change only effects new requests.",
      },
    });
    if (!confirmed) {
      return;
    }
    return fetcher.submit(
      {
        key: keyStr,
        hookId,
      },
      { action: `/hooks/${hookId}/secrets/delete`, method: "post" }
    );
  }, [fetcher, keyStr, hookId, pushModal]);

  return (
    <tr className="odd:bg-canvas-100">
      <td className="py-1 px-3 w-24">{keyStr}</td>
      <td className="px-3">{valueStr}</td>
      <td className="space-x-1 flex flex-row">
        <button
          type="button"
          onClick={deleteSecret}
          disabled={transition.state === "submitting"}
          className="p-1 hover:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-400 rounded"
        >
          <BackspaceIcon className="w-5 h-5" />
        </button>
      </td>
    </tr>
  );
};

export default function Secrets() {
  const { secrets } = useLoaderData<{ secrets: Record<string, string> }>();
  const transition = useTransition();
  const actionData = useActionData();
  const { hook } = useOutletContext<{ hook: HookDetail }>();

  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (actionData?.success) {
      toast("Your secret's safe with me");
      ref.current && ref.current.reset();
    }
  }, [actionData]);
  return (
    <>
      <InfoPanel
        id="secrets"
        heading="Secrets are visible at runtime"
        description={
          <>
            Don't store secrets in your code, put them here! We'll do everything
            we can to keep them safe and only expose them to your code at
            runtime. Once you give us a secret, we won't show it to you again,
            so make sure to save secrets elsewhere! When you revoke a secret,
            its gone, so be careful. Changes to secrets do not trigger
            recomputation of state.
          </>
        }
      />
      <Form method="post" ref={ref}>
        <table
          style={{ borderCollapse: "separate", borderSpacing: "0" }}
          className="text-sm font-mono table-fixed w-full max-w-full"
        >
          <thead>
            <tr>
              <th className="text-left py-1 px-3 w-24">Key</th>
              <th className="text-left py-1 px-3 w-24">SHA256 Digest</th>
              <th className="w-6"></th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(secrets).map((key) => (
              <SecretRow
                hookId={hook.id}
                key={key}
                keyStr={key}
                valueStr={secrets[key]}
              />
            ))}
            <tr>
              <td className="py-1 px-2 w-24">
                <input
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      return;
                    }
                    e.currentTarget.value = (e.currentTarget.value + e.key)
                      .toUpperCase()
                      .split(" ")
                      .join("_");
                    e.preventDefault();
                    return false;
                  }}
                  name="key"
                  className="w-full p-1"
                  placeholder="new key"
                />
              </td>
              <td className="py-1 px-2 w-24">
                <input
                  name="value"
                  className="w-full p-1"
                  placeholder="new value"
                />
              </td>
              <td className="w-6">
                <Button
                  type="submit"
                  icon={PlusCircleIcon}
                  size="xs"
                  color="light"
                  outline={false}
                  disabled={transition.state === "submitting"}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </Form>
    </>
  );
}
