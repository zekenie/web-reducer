import {
  ArrowLeftIcon,
  ArrowUpIcon,
  ClipboardCopyIcon,
} from "@heroicons/react/outline";
import type { LoaderFunction } from "@remix-run/node";
import { useLoaderData, useOutletContext, useParams } from "@remix-run/react";
import { FC, useCallback, useEffect, useState } from "react";
import CopyableCode, {
  VariableSelect,
  VariableValue,
} from "~/components/copyable-code";
import setupWebsocket from "~/remote/authenticated-websocket.client";
import type {
  HookDetail,
  PaginatedTokenResponse,
  Request,
} from "~/remote/hook-client.server";
import buildClientForJwt from "~/remote/index.server";

export const loader: LoaderFunction = async ({ context, params }) => {
  const client = buildClientForJwt(context.creds.jwt);

  return {
    siteUrl: process.env.SITE_URL,
    history: await client.hooks.history(params.hookId!),
  };
};

type SocketMessage = {
  type: "new-request";
  request: Request;
  readKeys: string[];
  hookId: string;
};

export default function Requests() {
  const { hook } = useOutletContext<{ hook: HookDetail }>();
  const { hookId } = useParams();
  const { siteUrl, history: paginatedHistory } = useLoaderData<{
    siteUrl: string;
    history: PaginatedTokenResponse<Request>;
  }>();
  const [loadedRecords, setLoadedRecords] = useState<Request[]>(
    paginatedHistory.objects
  );

  const addMessageToRecords = useCallback((message: Request) => {
    setLoadedRecords((loadedRecords) => [message, ...loadedRecords]);
  }, []);

  useEffect(() => {
    const { close } = setupWebsocket<SocketMessage>({
      hookId: hookId!,
      onMessage: (sm) => addMessageToRecords(sm.request),
    });
    return close;
  }, [addMessageToRecords, hookId]);

  if (loadedRecords.length === 0) {
    return <EmptyState readKeys={hook.readKeys} siteUrl={siteUrl} />;
  }
  return (
    <div>
      {loadedRecords.map((r) => (
        <div key={r.requestId}>
          {r.requestId} - {r.bodyHash}
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  siteUrl,
  readKeys,
}: {
  siteUrl: string;
  readKeys: string[];
}) {
  return (
    <div className="py-32 m-2 flex items-center justify-center space-y-4 rounded-lg 0 text-canvas-500 flex-col ">
      <div className="text-6xl font-extrabold font-mono text-canvas-400">
        []
      </div>
      <div className="text-xl font-bold text-canvas-400">No requests yet.</div>

      <CopyableCode>
        <div>
          <span className="text-fern-900">$</span> curl -X POST \
        </div>{" "}
        <div>
          &nbsp;&nbsp;-d '
          <VariableValue initialValue={JSON.stringify({ foo: "bar" })} />' \
        </div>
        <div>
          &nbsp;&nbsp;-H 'Content-Type:{" "}
          <VariableSelect
            selected="application/json"
            options={[
              "application/json",
              "application/x-www-form-urlencoded",
              "application/xml",
              "text/plain",
            ]}
          />
          ' \
        </div>
        <div>
          &nbsp;&nbsp;{siteUrl}/
          <VariableSelect selected={readKeys[0]} options={readKeys} />
          {/* <VariableValue initialValue="gXm0UijDJH3yLpY8JObYN" /> */}
        </div>
      </CopyableCode>

      {/* <div className="flex text-sm flex-row space-x-4 items-center"></div> */}
    </div>
  );
}
