import { useMemo } from "react";
import type { Request } from "~/remote/hook-client.server";
import RequestRow, { DateRow } from "./request-row";

export type PostProcessedRequest = Request & {
  createdAtFormattedDate: string;
  createdAtFormattedTime: string;
};

const dayFormatter = Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

const timeFormatter = Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "numeric",
});

export default function RequestsTable({ requests }: { requests: Request[] }) {
  const postProcessedRequests: PostProcessedRequest[] = useMemo(() => {
    return requests.map((request) => ({
      ...request,
      createdAtFormattedDate: dayFormatter.format(request.createdAt),
      createdAtFormattedTime: timeFormatter.format(request.createdAt),
    }));
  }, [requests]);

  const firstRow = useMemo(
    () => postProcessedRequests[0],
    [postProcessedRequests]
  );

  return (
    <table
      style={{ borderCollapse: "separate", borderSpacing: "0" }}
      className="text-sm font-mono table-fixed w-full max-w-full"
    >
      <thead>
        <tr className="bg-white sticky top-0">
          <th className="text-left py-1 px-3 w-24">when</th>
          <th className="text-left py-1 px-3">body</th>
          <th className="text-left py-1 px-3">state</th>
          <th className="text-left py-1 px-3 w-24">artifacts</th>
        </tr>
      </thead>
      <tbody>
        {firstRow && <DateRow date={firstRow.createdAtFormattedDate} />}
        {postProcessedRequests.map((r, i) => {
          const nextReq = postProcessedRequests[i + 1];
          return <RequestRow key={r.requestId} req={r} nextReq={nextReq} />;
        })}
      </tbody>
    </table>
  );
}
