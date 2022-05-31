import type { LoaderFunction } from "@remix-run/node";
import {
  useFetcher,
  useLoaderData,
  useOutletContext,
  useParams,
} from "@remix-run/react";
import { useCallback, useEffect, useState } from "react";
import CopyableCode, {
  VariableSelect,
  VariableValue,
} from "~/components/copyable-code";
import RequestsTable from "~/components/hook/requests-table";
import setupWebsocket from "~/remote/authenticated-websocket.client";
import type {
  HookDetail,
  PaginatedTokenResponse,
  Request,
} from "~/remote/hook-client.server";
// import buildClientForJwt from "~/remote/index.server";
import { loader } from "./history";

export { loader };

type SocketMessage =
  | {
      type: "new-request";
      request: Request;
      readKeys: string[];
      hookId: string;
    }
  | {
      type: "bulk-update";
      hookId: string;
    };

export default function Requests() {
  const { hook } = useOutletContext<{ hook: HookDetail }>();
  const { hookId } = useParams();
  const fetcher = useFetcher();
  const { siteUrl, history: paginatedHistory } = useLoaderData<{
    siteUrl: string;
    history: PaginatedTokenResponse<Request>;
  }>();
  const [loadedRecords, setLoadedRecords] = useState<Request[]>(
    paginatedHistory.objects
  );

  useEffect(() => {
    if (fetcher.data) {
      setLoadedRecords(fetcher.data.history.objects);
    }
  }, [fetcher]);

  const handleSocketMessage = useCallback(
    (message: SocketMessage) => {
      switch (message.type) {
        case "new-request":
          setLoadedRecords((loadedRecords) => [
            message.request,
            ...loadedRecords,
          ]);
          break;
        case "bulk-update":
          fetcher.load(`/hooks/${hook.id}/history`);
          break;
      }
    },
    [fetcher, hook.id]
  );

  useEffect(() => {
    const { close } = setupWebsocket<SocketMessage>({
      hookId: hookId!,
      onMessage: (sm) => handleSocketMessage(sm),
    });
    return close;
  }, [handleSocketMessage, hookId]);

  if (loadedRecords.length === 0) {
    return <EmptyState writeKeys={hook.writeKeys} siteUrl={siteUrl} />;
  }
  return <RequestsTable requests={loadedRecords} />;
}

function EmptyState({
  siteUrl,
  writeKeys,
}: {
  siteUrl: string;
  writeKeys: string[];
}) {
  return (
    <div className="py-32 m-2 flex items-center justify-center space-y-4 rounded-lg 0 text-canvas-500 flex-col ">
      <div className="text-6xl font-extrabold font-mono text-canvas-400">
        []
      </div>
      <div className="text-xl font-bold text-canvas-400">No requests yet.</div>

      <CopyableCode>
        <div>
          <span className="text-fern-900 no-copy">$</span> curl -X POST \
        </div>{" "}
        <div>
          -d '
          <VariableValue initialValue={JSON.stringify({ foo: "bar" })} />' \
        </div>
        <div>
          -H 'Content-Type:{" "}
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
          {siteUrl}/
          <VariableSelect selected={writeKeys[0]} options={writeKeys} />
          {/* <VariableValue initialValue="gXm0UijDJH3yLpY8JObYN" /> */}
        </div>
      </CopyableCode>

      {/* <div className="flex text-sm flex-row space-x-4 items-center"></div> */}
    </div>
  );
}
