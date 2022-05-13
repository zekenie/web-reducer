import {
  ArrowLeftIcon,
  ArrowUpIcon,
  ClipboardCopyIcon,
} from "@heroicons/react/outline";
import type { LoaderFunction } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import { FC, useCallback, useEffect, useState } from "react";
import setupWebsocket from "~/remote/authenticated-websocket.client";
import type {
  PaginatedTokenResponse,
  Request,
} from "~/remote/hook-client.server";
import buildClientForJwt from "~/remote/index.server";

export const loader: LoaderFunction = async ({ context, params }) => {
  const client = buildClientForJwt(context.creds.jwt);

  return client.hooks.history(params.hookId!);
};

type SocketMessage = {
  type: "new-request";
  state: Request;
  readKeys: string[];
  hookId: string;
};

export default function Requests() {
  const { hookId } = useParams();
  const paginatedHistory = useLoaderData<PaginatedTokenResponse<Request>>();
  const [loadedRecords, setLoadedRecords] = useState<Request[]>(
    paginatedHistory.objects
  );

  const addMessageToRecords = useCallback((message: Request) => {
    setLoadedRecords((loadedRecords) => [message, ...loadedRecords]);
  }, []);

  useEffect(() => {
    const { close } = setupWebsocket<SocketMessage>({
      hookId: hookId!,
      onMessage: (sm) => addMessageToRecords(sm.state),
    });
    return close;
  }, [addMessageToRecords, hookId]);

  if (loadedRecords.length === 0) {
    return <EmptyState />;
  }
  return (
    <div>
      {loadedRecords.map((r) => (
        <div key={r.requestId}>{r.requestId}</div>
      ))}
    </div>
  );
}

const VariableValue: FC = ({ children }) => (
  <span className="border-b-2 border-dashed  border-canvas-400 text-canvas-400">
    {children}
  </span>
);

function EmptyState() {
  return (
    <div className="py-32 m-2 flex items-center justify-center space-y-4 rounded-lg 0 text-canvas-500 flex-col ">
      <div className="text-6xl font-extrabold font-mono text-canvas-400">
        []
      </div>
      <div className="text-xl font-bold text-canvas-400">No requests yet.</div>

      <div className="border bg-canvas-50 overflow-hidden relative  px-3 py-2 rounded font-mono text-md">
        <div className="absolute bg-white  top-0 right-0 p-1 border-l border-b rounded-bl">
          <ClipboardCopyIcon className="h-3.5 w-3.5" />
        </div>
        <div>$ curl -X POST \</div>{" "}
        <div>
          -d '<VariableValue>{JSON.stringify({ foo: "bar" })}</VariableValue>' \
        </div>
        <div>-H 'Content-Type: application/json' \</div>
        <div>
          https://write.webreducer.dev/
          <VariableValue>gXm0UijDJH3yLpY8JObYN</VariableValue>
        </div>
      </div>

      <div className="flex text-sm flex-row space-x-4 items-center"></div>
    </div>
  );
}
