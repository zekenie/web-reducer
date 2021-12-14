import React from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  InboxInIcon,
  KeyIcon,
  MenuIcon,
} from "@heroicons/react/outline";
import Editor from "@monaco-editor/react";
import { Tab, Tabs } from "./components/Tabs";
import { useRegisterActions } from "kbar";

const ResourceBar = () => {
  return (
    <div className="font-mono flex-1 itens-center rounded bg-canvas-50 hover:bg-canvas-100 text-canvas-500 cursor-pointer border p-2 cursor-no flex space-x-2">
      <div className="bg-sky-500 text-white p-1 rounded flex items-center justify-center text-xs font-bold">
        your-hooks
      </div>
      <ChevronRightIcon className="w-4 h-4 self-center" />

      <div className="font-mono">demo-hook</div>

      <div className="flex-1" />
      <div className="bg-fern-500 h-2 w-2 rounded-full self-center"></div>
      <div className="flex border items-center space-x-1 flex-row text-canvas-400 px-2 p-1 rounded text-xs font-bold">
        <InboxInIcon className="w-4 h-4 self-center" />
        <div className="self-center">1.2k</div>
      </div>
      <div className="flex border items-center space-x-1 flex-row text-canvas-400 px-2 p-1 rounded text-xs font-bold">
        <KeyIcon className="w-4 h-4 self-center" />
        <div className="self-center">2</div>
      </div>
      <ChevronDownIcon className="w-4 h-4 self-center" />
    </div>
  );
};

const exampleCode = `function getIdempotencyKey({ headers }) {
  return headers["x-something"];
}

function isAuthentic({ headers }) {
  const hmacHeader = headers["X-Hmac-Sha256"];
  const hash = crypto
    .createHmac("sha256", secrets['hmac-secret'])
    .update(body, "utf8", "hex")
    .digest("base64");

  return hash === hmacHeader
}

function reducer(previousState, webhook) {
  return {
    ...previousState,
    [webhook.body.companyId]: webhook.body.updatedAt
  }
}`;

function App() {
  useRegisterActions([
    {
      id: "requests",
      name: "Requests",

      // shortcut: ["a"],
      section: "demo-hook",
      keywords: "See recent requests",
      perform: () => (window.location.pathname = "hooks"),
    },
    {
      id: "state",
      name: "State",

      // shortcut: ["a"],
      section: "demo-hook",
      perform: () => (window.location.pathname = "hooks"),
    },
    {
      id: "keys",
      name: "Keys",

      // shortcut: ["a"],
      section: "demo-hook",
      perform: () => (window.location.pathname = "hooks"),
    },
    {
      id: "config",
      name: "Config",

      // shortcut: ["a"],
      section: "demo-hook",
      perform: () => (window.location.pathname = "hooks"),
    },
    {
      id: "docs",
      name: "Docs",

      // shortcut: ["a"],
      section: "demo-hook",
      perform: () => (window.location.pathname = "hooks"),
    },
  ]);
  return (
    <div>
      <header className="px-3 py-3 border-b grid grid-cols-3">
        <div className="flex flex-row items-center space-x-4">
          <button className="p-3 hover:bg-canvas-50 rounded-full">
            <MenuIcon className="w-7 h-7 self-center" />
          </button>

          <img className="w-56" alt="Hook Reducer" src="/logo.svg" />
        </div>
        <div className="flex items-center justify-center">
          <ResourceBar />
        </div>
        <div />
      </header>

      <section className="grid grid-cols-2">
        <Editor
          options={{
            fontSize: "16px",
            minimap: { enabled: false },
          }}
          defaultLanguage="javascript"
          defaultValue={exampleCode}
        />

        <div className="border-l">
          <Tabs>
            <Tab selected>Requests</Tab>
            <Tab>State</Tab>
            <Tab>Keys</Tab>
            <Tab>Config</Tab>
            <Tab>Docs</Tab>
          </Tabs>
        </div>
      </section>
    </div>
  );
}

export default App;
