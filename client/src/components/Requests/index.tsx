import React, { FC, useEffect, useState } from "react";
import { uniqueId } from "lodash";
import { toSvg } from "jdenticon";
import axios from "axios";
import {
  DuplicateIcon,
  ExclamationCircleIcon,
  TerminalIcon,
} from "@heroicons/react/outline";

type Effect = "stdout" | "errors" | "noIdempotencyKey";

type Request = {
  id: string;
  body: string;
  hash: string;
  createdAt: string;
  effects: Effect[];
};

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

const JsonPreview: FC<{ w?: number }> = ({ children, w = 48 }) => {
  return (
    <div className={`w-${w} text-canvas-500 text-xs truncate`}>{children}</div>
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
  useEffect(() => {
    getRequests().then((reqs) => setRequests(reqs));
  }, []);
  return (
    <table
      style={{ borderCollapse: "separate", borderSpacing: "0" }}
      className="text-sm font-mono table-auto w-full"
    >
      <thead className="">
        <tr className="bg-white sticky top-0 drop-shadow-sm">
          <th className="text-left p-2">when</th>
          <th className="text-left p-2">body</th>
          <th className="text-left p-2">state</th>
          <th className="text-left p-2">effects</th>
        </tr>
      </thead>
      <tbody>
        {requests.map((r) => (
          <tr key={r.id} className="odd:bg-canvas-100">
            <td className="p-2">
              <JsonPreview w={40}>{r.createdAt}</JsonPreview>
            </td>
            <td className="p-2 flex space-x-2 flex-row items-center">
              <VisualHash input={r.hash} size={35} />
              <JsonPreview w={56}>{r.body}</JsonPreview>
            </td>
            <td>
              <JsonPreview w={56}>{fakeState}</JsonPreview>
            </td>
            <td>
              <div className="flex flex-row justify-center space-x-1">
                {r.effects.map((effect) => (
                  <IconForEffect effect={effect} />
                ))}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
