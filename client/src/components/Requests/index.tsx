import {
  DuplicateIcon,
  ExclamationCircleIcon,
  TerminalIcon,
} from "@heroicons/react/outline";
import axios from "axios";
import { toSvg } from "jdenticon";
import React, {
  FC,
  RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Effect = "stdout" | "errors" | "noIdempotencyKey";

type Request = {
  id: string;
  body: string;
  hash: string;
  createdAt: Date;
  createdAtFormattedTime: string;
  createdAtFormattedDate: string;
  effects: Effect[];
};

function areDaysDifferent(r1: Request, r2: Request) {
  return r1.createdAtFormattedDate !== r2.createdAtFormattedDate;
}

const fakeState = `{
  "closed": 4,
  "blocked": 3,
  "edited: 6,
  "created: 1
}`;

async function getRequests(): Promise<Request[]> {
  const { data } = await axios.get<Request[]>("http://localhost:3004");
  return data;
}

function VisualHash({ input, size }: { input: string; size: number }) {
  return <div dangerouslySetInnerHTML={{ __html: toSvg(input, size) }} />;
}

const JsonPreview: FC = ({ children }) => {
  return (
    <div className={`overflow-hidden text-canvas-500 text-xs truncate`}>
      {children}
    </div>
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

export default function Requests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const headerRef = useRef<HTMLTableRowElement>(null);
  useEffect(() => {
    getRequests().then((reqs) => setRequests(reqs));
  }, []);

  const firstRow = useMemo(() => requests[0], [requests]);

  return (
    <table
      style={{ borderCollapse: "separate", borderSpacing: "0" }}
      className="text-sm font-mono table-fixed w-full max-w-full"
    >
      <thead className="">
        <tr ref={headerRef} className="bg-white sticky top-0">
          <th className="text-left py-1 px-3 w-24">when</th>
          <th className="text-left py-1 px-3">body</th>
          <th className="text-left py-1 px-3">state</th>
          <th className="text-left py-1 px-3 w-24">effects</th>
        </tr>
      </thead>
      <tbody>
        {firstRow && (
          <DateRow
            headerRef={headerRef}
            date={firstRow.createdAtFormattedDate}
          />
        )}
        {requests.map((r, i) => {
          const nextRow = requests[i + 1];
          const isNextDay = nextRow && areDaysDifferent(r, nextRow);
          return (
            <>
              <tr key={r.id} className="odd:bg-canvas-100">
                <td className="py-1 px-3">
                  <JsonPreview>{r.createdAtFormattedTime}</JsonPreview>
                </td>
                <td className="max-w-full py-1 px-3 flex space-x-2 flex-row items-center">
                  <VisualHash input={r.hash} size={35} />
                  <JsonPreview>{r.body}</JsonPreview>
                </td>
                <td className="py-1 px-3">
                  <JsonPreview>{fakeState}</JsonPreview>
                </td>
                <td className="py-1 px-3">
                  <div className="flex flex-row justify-center space-x-1">
                    {r.effects.map((effect) => (
                      <IconForEffect effect={effect} />
                    ))}
                  </div>
                </td>
              </tr>
              {isNextDay && (
                <DateRow
                  headerRef={headerRef}
                  date={nextRow.createdAtFormattedDate}
                />
              )}
            </>
          );
        })}
      </tbody>
    </table>
  );
}

const DateRow = ({
  headerRef,
  date,
}: {
  date: string;
  headerRef: RefObject<HTMLTableRowElement>;
}) => (
  <tr
    className="sticky"
    style={{ top: (headerRef.current?.clientHeight || 0) + "px" }}
  >
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
