import {
  BackspaceIcon,
  ClipboardCopyIcon,
  InformationCircleIcon,
  PlusCircleIcon,
} from "@heroicons/react/outline";
import {
  Form,
  useActionData,
  useFetcher,
  useOutletContext,
  useTransition,
} from "@remix-run/react";
import type { ActionFunction } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { Alert, Button, Select } from "flowbite-react";
import { Fragment, useCallback, useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { useModals } from "~/modals/lib/modal-provider";
import type { HookDetail } from "~/remote/hook-client.server";
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

const KeyRow = ({
  keyObj,
  hookId,
}: {
  keyObj: { type: "read" | "write"; key: string };
  hookId: string;
}) => {
  const transition = useTransition();
  const fetcher = useFetcher();

  const { pushModal } = useModals();
  const deleteKey = useCallback(async () => {
    const confirmed = await pushModal({
      name: "confirm",
      props: {
        title: `Confirm deleting ${keyObj.type} key!`,
        body: `Deleting this ${keyObj.type} key will mean that anyone using it will no longer be able to ${keyObj.type} this hook.`,
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
      { action: `/hooks/${hookId}/keys/delete`, method: "post" }
    );
  }, [fetcher, keyObj, hookId, pushModal]);

  const copy = useCallback(async () => {
    const host = window.location.host;
    await navigator.clipboard.writeText(`${host}/${keyObj.type}/${keyObj.key}`);
    toast.success("It's on your clipboard", {
      icon: <ClipboardCopyIcon className="w-5 h-5 text-fern-600" />,
    });
  }, [keyObj]);

  return (
    <tr className="odd:bg-canvas-100">
      <td className="py-1 px-3 w-24">{keyObj.type}</td>
      <td className="px-3 flex flex-row space-x-2 items-center">
        {keyObj.key}{" "}
        <button
          type="button"
          onClick={copy}
          disabled={transition.state === "submitting"}
          className="p-1 hover:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-400 rounded"
        >
          <ClipboardCopyIcon className="w-5 h-5" />
        </button>
      </td>
      <td className="">
        <button
          type="button"
          onClick={deleteKey}
          disabled={transition.state === "submitting"}
          className="p-1 hover:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-400 rounded"
        >
          <BackspaceIcon className="w-5 h-5" />
        </button>
      </td>
    </tr>
  );
};

export default function Keys() {
  const { hook } = useOutletContext<{ hook: HookDetail }>();

  const transition = useTransition();
  const actionData = useActionData();

  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (actionData?.success) {
      toast("Key created");
      ref.current && ref.current.reset();
    }
  }, [actionData]);

  const keyObjs = useMemo(() => {
    const readKeys = hook.readKeys.map((k) => ({ type: "read", key: k }));
    const writeKeys = hook.writeKeys.map((k) => ({ type: "write", key: k }));
    return [...readKeys, ...writeKeys] as {
      key: string;
      type: "read" | "write";
    }[];
  }, [hook]);
  return (
    <>
      <Alert
        rounded={false}
        color="blue"
        onDismiss={() => {}}
        additionalContent={
          <Fragment>
            <div className="mt-2 mb-4 text-sm text-blue-700 ">
              There is a URL for every key. If someone has access to that URL,
              they will be able to read or write to this hook. If you delete a
              key, that access will be revoked. Read keys can also be used by
              our websocket endpoint to get realtime updates.
            </div>
            {/* <div className="flex">
              <button
                type="button"
                className="rounded-lg border border-blue-700 bg-transparent px-3 py-1.5 text-center text-xs font-medium text-blue-700 hover:bg-blue-800 hover:text-white focus:ring-4 focus:ring-blue-300 "
              >
                Dismiss
              </button>
            </div> */}
          </Fragment>
        }
        icon={InformationCircleIcon}
      >
        <h3 className="text-lg font-medium text-blue-700 ">
          Keys let you read and write data
        </h3>
      </Alert>
      <Form method="post" ref={ref}>
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
            {keyObjs.map((keyObj) => (
              <KeyRow hookId={hook.id} key={keyObj.key} keyObj={keyObj} />
            ))}
            <tr>
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
            </tr>
          </tbody>
        </table>
      </Form>
    </>
  );
}
