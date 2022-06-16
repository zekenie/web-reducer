import {
  ReactChild,
  ReactChildren,
  useCallback,
  useRef,
  useState,
} from "react";
import CopyableCode, {
  VariableSelect,
  VariableValue,
} from "~/components/copyable-code";
import { Button, Spinner } from "flowbite-react";

export default function EmptyState({
  siteUrl,
  writeKeys,
  onRequest,
  spaceOut,
  children = <></>,
}: {
  siteUrl: string;
  spaceOut?: boolean;
  writeKeys: string[];
  onRequest?: () => void;
  children?: ReactChild | ReactChildren;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [exampleReqClicked, setExampleReqClicked] = useState(false);
  const makeExampleRequest = useCallback(async () => {
    for (let i = 0; i < 3; i++) {
      if (!ref.current) {
        return;
      }
      setExampleReqClicked(true);
      const contentType =
        ref.current.querySelector<HTMLSelectElement>("#contentType")!.value;
      const writeKey =
        ref.current.querySelector<HTMLSelectElement>("#writeKey")!.value;
      const body =
        ref.current.querySelector<HTMLSpanElement>("#body")?.innerText;

      await fetch(`${siteUrl}/write/${writeKey}`, {
        body,
        headers: { "content-type": contentType },
        method: "POST",
      });
    }
    if (onRequest) {
      onRequest();
    }
  }, [ref, onRequest, siteUrl]);
  return (
    <div
      ref={ref}
      className=" z-0 m-2 flex items-center justify-center space-y-4 rounded-lg 0 text-canvas-500 flex-col "
    >
      {children}
      <CopyableCode>
        <div>
          <span className="text-fern-900 no-copy">$</span> curl -X POST \
        </div>{" "}
        <div>
          -d '
          <VariableValue
            id="body"
            initialValue={JSON.stringify({ foo: "bar" })}
          />
          ' \
        </div>
        <div>
          -H 'Content-Type:{" "}
          <VariableSelect
            id="contentType"
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
          {siteUrl}/write/
          <VariableSelect
            id="writeKey"
            selected={writeKeys[0]}
            options={writeKeys}
          />
        </div>
      </CopyableCode>
      {spaceOut && <div className="h-32" />}
      <Button
        onClick={makeExampleRequest}
        data-tour-id="lazy-button"
        disabled={exampleReqClicked}
        size="sm"
        color="alternative"
      >
        {exampleReqClicked && <Spinner className="mr-2" />}
        I'm lazy,{" "}
        <span className="bg-canvas-50 font-mono p-0.5 rounded  mx-1">
          $ curl
        </span>{" "}
        it for me
      </Button>
    </div>
  );
}
