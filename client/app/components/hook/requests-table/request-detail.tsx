import Editor, { DiffEditor } from "@monaco-editor/react";
import { useState } from "react";
import { Tab, Tabs } from "~/components/tabs";
import type { PostProcessedRequest } from ".";

export default function RequestDetail({
  req,
  lastReq,
}: {
  req: PostProcessedRequest;
  lastReq?: PostProcessedRequest;
}) {
  const [tab, setTab] = useState<"request" | "state" | "console" | "errors">(
    "request"
  );

  return (
    <div className="border rounded h-72 overflow-hidden pb-6 m-2 bg-white font-sans">
      <Tabs>
        <Tab onClick={() => setTab("request")} selected={tab === "request"}>
          Request
        </Tab>
        <Tab onClick={() => setTab("state")} selected={tab === "state"}>
          State
        </Tab>
        <Tab onClick={() => setTab("console")} selected={tab === "console"}>
          Console
        </Tab>
        {req.error && (
          <Tab onClick={() => setTab("errors")} selected={tab === "errors"}>
            Error
          </Tab>
        )}
      </Tabs>

      <div className="m-2 h-full overflow-y-scroll">
        {tab === "request" && <Request req={req} />}
        {tab === "state" && <State req={req} lastReq={lastReq} />}
        {tab === "console" && <Console req={req} />}
        {tab === "errors" && <Errors req={req} />}
      </div>
    </div>
  );
}

const Request = ({ req }: { req: PostProcessedRequest }) => {
  return (
    <Editor
      language="json"
      options={{ fontSize: 14, minimap: { enabled: false }, readOnly: true }}
      defaultValue={JSON.stringify(
        { body: req.body, headers: req.headers, queryString: req.queryString },
        null,
        2
      )}
    />
  );
};

const Console = ({ req }: { req: PostProcessedRequest }) => {
  return (
    <div className="divide-y">
      {req.console.map((c) =>
        // prettier-ignore
        <pre key={c.timestamp}>[{c.level}][{c.timestamp}] {c.messages.join(", ")}</pre>
      )}
    </div>
  );
};

const Errors = ({ req }: { req: PostProcessedRequest }) => {
  return <pre>{JSON.stringify(req.error, null, 2)}</pre>;
};

const State = ({
  req,
  lastReq,
}: {
  req: PostProcessedRequest;
  lastReq?: PostProcessedRequest;
}) => {
  return (
    <DiffEditor
      language="json"
      options={{
        renderSideBySide: false,
        fontSize: 14,
        minimap: { enabled: false },
        readOnly: true,
      }}
      original={JSON.stringify(lastReq?.state, null, 2)}
      modified={JSON.stringify(req.state, null, 2)}
    />
  );
};
