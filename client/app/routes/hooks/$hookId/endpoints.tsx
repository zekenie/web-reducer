import {
  BookOpenIcon,
  LinkIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
} from "@heroicons/react/outline";
import {
  useActionData,
  useFetcher,
  useLoaderData,
  useOutletContext,
  useTransition,
} from "@remix-run/react";
import type { ActionFunction, LoaderFunction } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { Button } from "flowbite-react";
import { useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import InfoPanel from "~/components/info-panel";
import { useModals } from "~/modals/lib/modal-provider";
import type { HookDetail, KeyRecord } from "~/remote/hook-client.server";
import buildClientForJwt from "~/remote/index.server";

export const action: ActionFunction = async ({ context, request, params }) => {
  const client = buildClientForJwt(context.creds.jwt);
  const body = await request.formData();
  await client.hooks.addKey({
    id: params.hookId!,
    type: body.get("type") as string,
  });
  return json({ success: true });
};

export const loader: LoaderFunction = async ({ context, params }) => {
  const client = buildClientForJwt(context.creds.jwt);
  const keys = await client.hooks.getKeys({ id: params.hookId! });
  return { keys };
};

const KeyRow = ({
  keyObj,
  hookId,
  siteUrl,
}: {
  keyObj: KeyRecord;
  hookId: string;
  siteUrl: string;
}) => {
  const transition = useTransition();
  const fetcher = useFetcher();

  const { pushModal } = useModals();
  const pauseKey = useCallback(async () => {
    const confirmed = await pushModal({
      name: "confirm",
      props: {
        title: `Confirm pausing ${keyObj.type} key!`,
        body: `Pausing this ${keyObj.type} key will mean that anyone using it will no longer be able to ${keyObj.type} this hook. But, previous requests will still be honored. You can re-enable this key at any time, but requests made in while it is paused will be lost.`,
      },
    });
    if (!confirmed) {
      return;
    }
    return fetcher.submit(
      {
        key: keyObj.key,
        hookId,
      },
      { action: `/hooks/${hookId}/endpoints/pause`, method: "post" }
    );
  }, [fetcher, keyObj, hookId, pushModal]);

  const playKey = useCallback(async () => {
    const confirmed = await pushModal({
      name: "confirm",
      props: {
        title: `Confirm re-enabling ${keyObj.type} key!`,
        body: `Re-enabling this ${keyObj.type} key will mean that anyone with access to it will regain the ability to ${keyObj.type} at that URL.`,
      },
    });
    if (!confirmed) {
      return;
    }
    return fetcher.submit(
      {
        key: keyObj.key,
        hookId,
      },
      { action: `/hooks/${hookId}/endpoints/play`, method: "post" }
    );
  }, [fetcher, keyObj, hookId, pushModal]);

  const copy = useCallback(async () => {
    const host = window.location.host;
    const protocol = window.location.protocol;
    await navigator.clipboard.writeText(
      `${protocol}//${host}/${keyObj.type}/${keyObj.key}`
    );
    toast.success("It's on your clipboard", {
      icon: <LinkIcon className="w-5 h-5 text-fern-600" />,
    });
  }, [keyObj]);

  return (
    <tr
      className={`odd:bg-canvas-100 ${
        keyObj.workflowState === "paused" ? " text-gray-500 line-through" : ""
      }`}
    >
      <td className="py-1 px-3 flex flex-row space-x-2 items-center">
        <span>
          {siteUrl}/<span className="italic font-semibold">{keyObj.type}</span>/
          {keyObj.key}
        </span>
      </td>
      <td className="space-x-2">
        <button
          data-tour-id={`${keyObj.type}-key-copy-link`}
          type="button"
          onClick={copy}
          disabled={transition.state === "submitting"}
          className="p-1 hover:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-400 rounded"
        >
          <LinkIcon className="w-5 h-5" />
        </button>
        {keyObj.workflowState === "live" ? (
          <button
            type="button"
            onClick={pauseKey}
            disabled={transition.state === "submitting"}
            className="p-1 hover:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-400 rounded"
          >
            <PauseIcon className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={playKey}
            disabled={transition.state === "submitting"}
            className="p-1 hover:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-400 rounded"
          >
            <PlayIcon className="w-5 h-5" />
          </button>
        )}
      </td>
    </tr>
  );
};

export default function Endpoints() {
  const { hook, siteUrl } = useOutletContext<{
    hook: HookDetail;
    siteUrl: string;
  }>();

  const { keys } = useLoaderData<{ keys: KeyRecord[] }>();
  const fetcher = useFetcher();

  const transition = useTransition();
  const actionData = useActionData();

  const createReadKey = useCallback(async () => {
    return fetcher.submit(
      {
        type: "read",
      },
      { action: `/hooks/${hook.id}/endpoints`, method: "post" }
    );
  }, [fetcher, hook]);

  const createWriteKey = useCallback(async () => {
    return fetcher.submit(
      {
        type: "write",
      },
      { action: `/hooks/${hook.id}/endpoints`, method: "post" }
    );
  }, [fetcher, hook]);

  useEffect(() => {
    if (actionData?.success) {
      toast("Key created");
    }
  }, [actionData]);

  return (
    <div className="relative flex-1">
      <InfoPanel
        id="Endpoints"
        heading="Endpoints let you read and write data"
        description={
          <>
            If someone has access to an endpoint, they will be able to read or
            write to this hook, depending on the type of endpoint. If you pause
            an endpoint, that access will be revoked until you re-enable it.
            Read endpoints can also be used by our websocket endpoint to get
            realtime updates.
          </>
        }
      />
      <table
        style={{ borderCollapse: "separate", borderSpacing: "0" }}
        className="text-sm font-mono table-fixed w-full max-w-full"
      >
        <thead>
          <tr>
            <th className="text-left w-56 py-1 px-3">Endpoint</th>
            <th className="w-6"></th>
          </tr>
        </thead>
        <tbody>
          {keys.map((keyObj) => (
            <KeyRow
              siteUrl={siteUrl}
              hookId={hook.id}
              key={keyObj.key}
              keyObj={keyObj}
            />
          ))}
        </tbody>
      </table>
      <div className="absolute bottom-4 right-4">
        <Button.Group outline>
          <Button
            disabled={transition.state === "submitting"}
            onClick={createReadKey}
            size="sm"
            color="alternative"
          >
            <BookOpenIcon className="w-4 h-4 mr-1" />
            <span>New read endpoint</span>
          </Button>
          <Button
            disabled={transition.state === "submitting"}
            size="sm"
            onClick={createWriteKey}
            color="alternative"
          >
            <PencilIcon className="w-4 h-4 mr-1" />
            <span>New write endpoint</span>
          </Button>
        </Button.Group>
      </div>
    </div>
  );
}
