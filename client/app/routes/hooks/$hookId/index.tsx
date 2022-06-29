import { ArchiveIcon, PlusIcon } from "@heroicons/react/outline";
import {
  useFetcher,
  useLoaderData,
  useOutletContext,
  useParams,
} from "@remix-run/react";
import { Button } from "flowbite-react";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import RequestsTable from "~/components/hook/requests-table";
import EmptyState from "~/components/hook/requests-table/empty-state";
import useIntersection from "~/hooks/useIntersection";
import { useModals } from "~/modals/lib/modal-provider";
// import setupWebsocket from "~/remote/authenticated-websocket.client";
import type {
  HookDetail,
  PaginatedTokenResponse,
  Request,
} from "~/remote/hook-client.server";
import type { SocketMessage } from "~/socket-messages.types";
import { useSocket } from "../$hookId";
import { loader } from "./history";

export { loader };

function useRequestRecords({
  hookId,
  paginatedHistory,
}: {
  hookId: string;
  paginatedHistory: PaginatedTokenResponse<Request>;
}) {
  const [nextToken, setNextToken] = useState(paginatedHistory.nextToken);
  const [loadedRecords, setLoadedRecords] = useState<Request[]>(
    paginatedHistory.objects
  );
  const [isLoadingNextPage, setIsLoadingNextPage] = useState(false);
  const fetcher = useFetcher();
  const loadNextPage = useCallback(async () => {
    if (isLoadingNextPage) {
      return;
    }
    setIsLoadingNextPage(true);
    const res = await fetch(`/hooks/${hookId}/history?token=${nextToken}`, {
      credentials: "same-origin",
      headers: { accept: "application/json" },
    });
    const nextPage = await res.json();
    setLoadedRecords((existing) => [...existing, ...nextPage.history.objects]);
    setNextToken(nextPage.history.nextToken);
    setIsLoadingNextPage(false);
  }, [hookId, nextToken, isLoadingNextPage]);

  useEffect(() => {
    if (fetcher.data) {
      setLoadedRecords(fetcher.data.history.objects);
    }
  }, [fetcher]);
  const [latestEventDedupped, setLatestEventDedupped] =
    useState<SocketMessage | null>(null);
  useEffect(() => {
    if (!latestEventDedupped) {
      return;
    }
    switch (latestEventDedupped.type) {
      case "new-request":
        setLoadedRecords((loadedRecords) => [
          latestEventDedupped.request,
          ...loadedRecords,
        ]);
        break;
      case "bulk-update":
        fetcher.load(`/hooks/${hookId}/history`);
        break;
    }
    setLatestEventDedupped(null);
  }, [fetcher, hookId, latestEventDedupped]);

  const { latestEvent } = useSocket<SocketMessage>();

  useEffect(() => {
    if (!latestEvent) {
      return;
    }
    setLatestEventDedupped(latestEvent);
  }, [latestEvent]);

  return { loadedRecords, nextToken, loadNextPage };
}

export default function Requests() {
  const fetcher = useFetcher();
  const { hook } = useOutletContext<{
    hook: HookDetail;
  }>();
  const { pushModal } = useModals();
  const { hookId } = useParams<{ hookId: string }>();
  const { siteUrl, history: paginatedHistory } = useLoaderData<{
    siteUrl: string;
    history: PaginatedTokenResponse<Request>;
  }>();

  const resetRequests = useCallback(async () => {
    const confirmed = await pushModal({
      name: "confirm",
      props: {
        title: `You are about to DELETE ALL PRIOR REQUESTS`,
        body: `THIS IS A DANGEROUS ACTION. BE CAREFUL.`,
      },
    });
    if (!confirmed) {
      return;
    }
    fetcher.submit(
      {},
      { action: `/hooks/${hookId}/reset-requests`, method: "post" }
    );

    toast.success("Requests archived", {
      icon: <ArchiveIcon className="w-5 h-5 text-fern-600" />,
    });
  }, [fetcher, hookId, pushModal]);

  const { loadedRecords, nextToken, loadNextPage } = useRequestRecords({
    paginatedHistory,
    hookId: hookId!,
  });

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
        <div className="fixed bottom-4 right-4">
          <Button.Group>
            <Button
              icon={PlusIcon}
              pill
              outline
              className="shadow "
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
            <Button
              icon={ArchiveIcon}
              pill
              outline
              className="shadow"
              color="alternative"
              onClick={resetRequests}
            />
          </Button.Group>
        </div>
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
