import {
  DuplicateIcon,
  ExclamationCircleIcon,
  TerminalIcon,
} from "@heroicons/react/outline";
import { toSvg } from "jdenticon";
import type { FC } from "react";
import { Fragment, useMemo } from "react";
import type { Request } from "~/remote/hook-client.server";

type Effect = "stdout" | "errors" | "noIdempotencyKey";

type PostProcessedRequest = Request & {
  createdAtFormattedDate: string;
  createdAtFormattedTime: string;
};

const JsonPreview: FC = ({ children }) => {
  return (
    <div className={`overflow-hidden text-canvas-500 text-xs truncate`}>
      {children}
    </div>
  );
};

function VisualHash({ input, size }: { input: string; size: number }) {
  return <div dangerouslySetInnerHTML={{ __html: toSvg(input, size) }} />;
}

function areDaysDifferent(r1: PostProcessedRequest, r2: PostProcessedRequest) {
  return r1.createdAtFormattedDate !== r2.createdAtFormattedDate;
}

const DateRow = ({ date }: { date: string }) => {
  return (
    <tr className="sticky" style={{ top: "28px" }}>
      <td
        className="relative bg-sky-400 overflow-visible drop-shadow-sm"
        style={{
          height: "0px",
        }}
        colSpan={4}
      >
        <div className="flex drop-shadow-sm justify-center absolute z-10 px-1 text-xs transform translate-y-4 bottom-0 left-0 rounded-br bg-sky-400 h-4 text-canvas-500">
          {date}
        </div>
      </td>
    </tr>
  );
};

const IconForEffect = ({ effect }: { effect: Effect }) => {
  switch (effect) {
    case "stdout":
      return <TerminalIcon className="w-4 h-4" />;
    case "noIdempotencyKey":
      return <DuplicateIcon className="w-4 h-4 text-sunglo-700" />;
    case "errors":
      return <ExclamationCircleIcon className="w-4 h-4 text-sunglo-700" />;
  }
};

const dayFormatter = Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  // hour: "numeric",
  // minute: "numeric",
});

const timeFormatter = Intl.DateTimeFormat("en-US", {
  // year: "numeric",
  // month: "numeric",
  // day: "numeric",
  hour: "numeric",
  minute: "numeric",
});

export default function RequestsTable({ requests }: { requests: Request[] }) {
  const postProcessedRequests: (Request & {
    createdAtFormattedDate: string;
    createdAtFormattedTime: string;
  })[] = useMemo(() => {
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
          <th className="text-left py-1 px-3 w-24">effects</th>
        </tr>
      </thead>
      <tbody>
        {firstRow && <DateRow date={firstRow.createdAtFormattedDate} />}
        {postProcessedRequests.map((r, i) => {
          const nextRow = postProcessedRequests[i + 1];
          const isNextDay = nextRow && areDaysDifferent(r, nextRow);
          return (
            <Fragment key={r.requestId}>
              <tr className="odd:bg-canvas-100">
                <td className="py-1 px-3">
                  <JsonPreview>{r.createdAtFormattedTime}</JsonPreview>
                </td>
                <td className="max-w-full py-1 px-3 flex space-x-2 flex-row items-center">
                  <VisualHash input={r.bodyHash} size={35} />
                  <JsonPreview>{JSON.stringify(r.body)}</JsonPreview>
                </td>
                <td className="py-1 px-3">
                  <JsonPreview>{JSON.stringify(r.state)}</JsonPreview>
                </td>
                {/* <td className="py-1 px-3">
                  <div className="flex flex-row justify-center space-x-1">
                    {r.effects.map((effect) => (
                      <IconForEffect effect={effect} />
                    ))}
                  </div>
                </td> */}
              </tr>
              {isNextDay && <DateRow date={nextRow.createdAtFormattedDate} />}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
