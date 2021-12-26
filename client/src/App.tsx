import { MenuIcon } from "@heroicons/react/outline";
import Editor from "@monaco-editor/react";
import { useRegisterActions } from "kbar";
import React from "react";
import Requests from "./components/Requests";
import ResourceBar from "./components/ResourceBar";
import { Tab, Tabs } from "./components/Tabs";
import { useModals } from "./modals/ModalProvider";

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
  if (!webhook.body.action) {
    console.warn("action not recognized!")
    return previousState;
  }
  return {
    ...previousState,
    [webhook.body.acction]:
      (previousState[webhook.body.acction] || 0) + 1
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

  const { pushModal } = useModals();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="px-3 flex-shrink-0 py-3 border-b grid grid-cols-3">
        <div className="flex flex-row items-center space-x-4">
          <button
            onClick={() =>
              pushModal({ name: "confirm", props: { text: "foo", faz: "sdf" } })
            }
            className="p-3 hover:bg-canvas-50 rounded-full"
          >
            <MenuIcon className="w-7 h-7 self-center" />
          </button>

          <img className="w-56" alt="Hook Reducer" src="/logo.svg" />
        </div>
        <div className="flex items-center justify-center">
          <ResourceBar />
        </div>
        <div />
      </header>

      <section className="flex-grow grid grid-cols-2 overflow-hidden">
        <div className="flex-grow">
          <Editor
            options={{
              fontSize: "16px",
              minimap: { enabled: false },
            }}
            defaultLanguage="javascript"
            defaultValue={exampleCode}
          />
        </div>

        <div className="border-l flex-grow flex-col flex flex-shrink-0 overflow-hidden">
          <Tabs>
            <Tab selected>Requests</Tab>
            <Tab>State</Tab>
            <Tab>Secrets</Tab>
            <Tab>Keys</Tab>
            <Tab>Config</Tab>
            <Tab>Docs</Tab>
          </Tabs>
          <div className="overflow-y-scroll flex-grow">
            <Requests />
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
