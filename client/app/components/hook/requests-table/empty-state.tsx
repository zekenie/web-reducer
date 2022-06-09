import { useCallback, useRef, useState } from "react";
import CopyableCode, {
  VariableSelect,
  VariableValue,
} from "~/components/copyable-code";
import { Button, Spinner } from "flowbite-react";

export default function EmptyState({
  siteUrl,
  writeKeys,
}: {
  siteUrl: string;
  writeKeys: string[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [exampleReqClicked, setExampleReqClicked] = useState(false);
  const makeExampleRequest = useCallback(async () => {
    if (!ref.current) {
      return;
    }
    setExampleReqClicked(true);
    const contentType =
      ref.current.querySelector<HTMLSelectElement>("#contentType")!.value;
    const writeKey =
      ref.current.querySelector<HTMLSelectElement>("#writeKey")!.value;
    const body = ref.current.querySelector<HTMLSpanElement>("#body")?.innerText;

    await fetch(`${siteUrl}/write/${writeKey}`, {
      body,
      headers: { "content-type": contentType },
      method: "POST",
    });
  }, [ref, siteUrl]);
  return (
    <div
      ref={ref}
      className=" z-0 py-32 m-2 flex items-center justify-center space-y-4 rounded-lg 0 text-canvas-500 flex-col "
    >
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
      <div className="h-32" />
      <Button
        onClick={makeExampleRequest}
        disabled={exampleReqClicked}
        size="sm"
        color="alternative"
      >
        {exampleReqClicked && <Spinner className="mr-2" />}
        (Or{" "}
        <span className="bg-canvas-50 font-mono p-0.5 rounded  mx-1">
          $ curl
        </span>{" "}
        it for me )
      </Button>
    </div>
  );
}
