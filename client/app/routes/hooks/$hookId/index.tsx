import { PlusIcon } from "@heroicons/react/outline";
import {
  useFetcher,
  useLoaderData,
  useOutletContext,
  useParams,
} from "@remix-run/react";
import { Button } from "flowbite-react";
import { useCallback, useEffect, useRef, useState } from "react";
import RequestsTable from "~/components/hook/requests-table";
import EmptyState from "~/components/hook/requests-table/empty-state";
import useIntersection from "~/hooks/useIntersection";
import { useModals } from "~/modals/lib/modal-provider";
import setupWebsocket from "~/remote/authenticated-websocket.client";
import type {
  HookDetail,
  PaginatedTokenResponse,
  Request,
} from "~/remote/hook-client.server";
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
  const [nextToken, setNextToken] = useState(paginatedHistory.nextToken);
  const [loadedRecords, setLoadedRecords] = useState<Request[]>(
    paginatedHistory.objects
  );

  const [isLoadingNextPage, setIsLoadingNextPage] = useState(false);

  const loadNextPage = useCallback(async () => {
    if (isLoadingNextPage) {
      return;
    }
    setIsLoadingNextPage(true);
    const res = await fetch(`/hooks/${hook.id}/history?token=${nextToken}`, {
      credentials: "same-origin",
      headers: { accept: "application/json" },
    });
    const nextPage = await res.json();
    setLoadedRecords((existing) => [...existing, ...nextPage.history.objects]);
    setNextToken(nextPage.history.nextToken);
    setIsLoadingNextPage(false);
  }, [hook, nextToken, isLoadingNextPage]);

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
  const { pushModal } = useModals();

  useEffect(() => {
    const { close } = setupWebsocket<SocketMessage>({
      hookId: hookId!,
      onMessage: (sm) => handleSocketMessage(sm),
    });
    return close;
  }, [handleSocketMessage, hookId]);

  if (loadedRecords.length === 0) {
    return (
      <EmptyState spaceOut writeKeys={hook.writeKeys} siteUrl={siteUrl}>
        <>
          <div className="pt-32 text-6xl font-extrabold font-mono text-canvas-400">
            []
          </div>
          <div className="text-xl font-bold text-canvas-400">
            No requests yet.
          </div>
        </>
      </EmptyState>
    );
  }
  return (
    <>
      <div className="relative flex-1">
        <RequestsTable requests={loadedRecords} />
        <Button
          icon={PlusIcon}
          pill
          className="absolute bottom-4 right-4"
          color="alternative"
          onClick={() =>
            pushModal({
              name: "new-request",
              props: {
                siteUrl,
                writeKeys: hook.writeKeys,
              },
            })
          }
        />
      </div>
      {nextToken && <LoadMoreFooter onEnterViewport={loadNextPage} />}
    </>
  );
}

function LoadMoreFooter({ onEnterViewport }: { onEnterViewport: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isShowing = useIntersection<HTMLDivElement>(ref, "0px");

  useEffect(() => {
    if (isShowing) {
      onEnterViewport();
    }
  }, [isShowing, onEnterViewport]);

  return (
    <div ref={ref} style={{ height: "25px", width: "100%", flexGrow: 1 }}>
      &nbsp;
    </div>
  );
}
