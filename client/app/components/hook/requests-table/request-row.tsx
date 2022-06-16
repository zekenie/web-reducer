import { ExclamationCircleIcon, TerminalIcon } from "@heroicons/react/outline";
import { toSvg } from "jdenticon";
import type { FC } from "react";
import { Fragment, useState } from "react";
import { Tab, Tabs } from "~/components/tabs";
import type { PostProcessedRequest } from ".";
import RequestDetail from "./request-detail";

const JsonPreview: FC = ({ children }) => {
  return (
    <div className={`overflow-hidden text-canvas-500 text-xs truncate`}>
      {children}
    </div>
  );
};

function areDaysDifferent(r1: PostProcessedRequest, r2: PostProcessedRequest) {
  return r1.createdAtFormattedDate !== r2.createdAtFormattedDate;
}

function VisualHash({ input, size }: { input: string; size: number }) {
  return <div dangerouslySetInnerHTML={{ __html: toSvg(input, size) }} />;
}

export default function RequestRow({
  req,
  nextReq,
}: {
  req: PostProcessedRequest;
  nextReq?: PostProcessedRequest;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isNextDay = nextReq && areDaysDifferent(req, nextReq);
  return (
    <Fragment>
      <tr
        onClick={() => setIsOpen(!isOpen)}
        className="border-t cursor-pointer hover:bg-canvas-50"
      >
        <td className="py-1 px-3">
          <JsonPreview>{req.createdAtFormattedTime}</JsonPreview>
        </td>
        <td className="max-w-full py-1 px-3 ">
          <div className="flex space-x-2 flex-row items-center">
            <VisualHash input={req.bodyHash} size={35} />
            <JsonPreview>{JSON.stringify(req.body)}</JsonPreview>
          </div>
        </td>
        <td className="py-1 px-3">
          <div
            data-tour-id="state-cell"
            className="flex space-x-2 flex-row items-center"
          >
            <VisualHash input={req.stateHash} size={35} />
            <JsonPreview>{JSON.stringify(req.state)}</JsonPreview>
          </div>
        </td>
        <td className="py-1 px-3">
          <div className="flex flex-row justify-center space-x-1">
            {req.console.length > 0 && <TerminalIcon className="w-4 h-4" />}
            {req.error && (
              <ExclamationCircleIcon className="w-4 h-4 text-sunglo-700" />
            )}
          </div>
        </td>
      </tr>
      {isOpen && (
        <tr className="">
          <td colSpan={4}>
            <RequestDetail req={req} lastReq={nextReq} />
          </td>
        </tr>
      )}
      {isNextDay && <DateRow date={nextReq.createdAtFormattedDate} />}
    </Fragment>
  );
}

export const DateRow = ({ date }: { date: string }) => {
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
