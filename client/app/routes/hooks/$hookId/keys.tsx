import {
  BookOpenIcon,
  LinkIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  PlusCircleIcon,
} from "@heroicons/react/outline";
import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
  useOutletContext,
  useTransition,
} from "@remix-run/react";
import type { ActionFunction, LoaderFunction } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { Button, Select } from "flowbite-react";
import { useCallback, useEffect, useRef, useState } from "react";
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

const KeyRow = ({ keyObj, hookId }: { keyObj: KeyRecord; hookId: string }) => {
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
      { action: `/hooks/${hookId}/keys/pause`, method: "post" }
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
      { action: `/hooks/${hookId}/keys/play`, method: "post" }
    );
  }, [fetcher, keyObj, hookId, pushModal]);

  const copy = useCallback(async () => {
    const host = window.location.host;
    await navigator.clipboard.writeText(`${host}/${keyObj.type}/${keyObj.key}`);
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
      <td className="py-1 px-3 w-24">{keyObj.type}</td>
      <td className="px-3 flex flex-row space-x-2 items-center">
        {keyObj.key}{" "}
        <button
          data-tour-id={`${keyObj.type}-key-copy-link`}
          type="button"
          onClick={copy}
          disabled={transition.state === "submitting"}
          className="p-1 hover:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-400 rounded"
        >
          <LinkIcon className="w-5 h-5" />
        </button>
      </td>
      <td className="">
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

export default function Keys() {
  const { hook } = useOutletContext<{ hook: HookDetail }>();
  const { keys } = useLoaderData<{ keys: KeyRecord[] }>();
  const fetcher = useFetcher();

  const transition = useTransition();
  const actionData = useActionData();

  const createReadKey = useCallback(async () => {
    return fetcher.submit(
      {
        type: "read",
      },
      { action: `/hooks/${hook.id}/keys`, method: "post" }
    );
  }, [fetcher, hook]);

  const createWriteKey = useCallback(async () => {
    return fetcher.submit(
      {
        type: "write",
      },
      { action: `/hooks/${hook.id}/keys`, method: "post" }
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
        id="keys"
        heading="Keys let you read and write data"
        description={
          <>
            There is a URL for every key. If someone has access to that URL,
            they will be able to read or write to this hook. If you pause a key,
            that access will be revoked until you re-enable it. Read keys can
            also be used by our websocket endpoint to get realtime updates.
          </>
        }
      />
      <table
        style={{ borderCollapse: "separate", borderSpacing: "0" }}
        className="text-sm font-mono table-fixed w-full max-w-full"
      >
        <thead>
          <tr>
            <th className="text-left py-1 px-3 w-24">Type</th>
            <th className="text-left py-1 px-3 w-24">Key</th>
            <th className="w-6"></th>
          </tr>
        </thead>
        <tbody>
          {keys.map((keyObj) => (
            <KeyRow hookId={hook.id} key={keyObj.key} keyObj={keyObj} />
          ))}
          {/* <tr>
              <td className="py-1 px-2 w-24">
                <Select name="type">
                  <option value="read">Read</option>
                  <option value="write">Write</option>
                </Select>
              </td>
              <td className="py-1 px-2 w-24"></td>
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
            </tr> */}
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
            <span>New read key</span>
          </Button>
          <Button
            disabled={transition.state === "submitting"}
            size="sm"
            onClick={createWriteKey}
            color="alternative"
          >
            <PencilIcon className="w-4 h-4 mr-1" />
            <span>New write key</span>
          </Button>
        </Button.Group>
      </div>
    </div>
  );
}
