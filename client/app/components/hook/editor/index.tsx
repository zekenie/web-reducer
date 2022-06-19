import {
  BookOpenIcon,
  LightningBoltIcon,
  SparklesIcon,
} from "@heroicons/react/outline";
import Editor, { DiffEditor } from "@monaco-editor/react";
import { useFetcher, useNavigate } from "@remix-run/react";
import { Button, Tooltip } from "flowbite-react";
import { debounce } from "lodash";
import type { ComponentProps, FC } from "react";
import { useCallback, useContext, useEffect, useState } from "react";
import type { HookDetail } from "~/remote/hook-client.server";
import { docsContext } from "~/routes/hooks/$hookId";

function EditorSwitch({
  hook,
  onChange,
  onInit,
  mode,
}: {
  mode: EditorModes;
  hook: HookDetail;
  onInit: (editor: any) => void;
  onChange: ComponentProps<typeof Editor>["onChange"];
}) {
  const [isSetup, setIsSetup] = useState(false);
  const [monaco, setMonaco] = useState<any>();

  const navigate = useNavigate();
  useEffect(() => {
    return () => {
      if (!monaco) {
        return;
      }
      monaco.editor
        .getModels()
        .forEach((model: { dispose: () => any }) => model.dispose());
    };
  }, [monaco]);
  const options = {
    fontSize: 14,
    minimap: { enabled: false },
    formatOnType: true,
  };
  switch (mode) {
    case "draft":
      return (
        <Editor
          options={options}
          onChange={onChange}
          defaultLanguage="typescript"
          onMount={async (editor) => {
            onInit(editor);
            if (hook.draft.length > 0) {
              return;
            }
            const startTutorial = (await import("./tutorial-bot")).default;
            const model = editor.getModel();
            console.log("here", model);
            if (model) {
              startTutorial({ editor, model, navigate });
            }
          }}
          onValidate={console.log}
          beforeMount={(monaco) => {
            if (isSetup) {
              return;
            }
            setMonaco(monaco);
            monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
              target: monaco.languages.typescript.ScriptTarget.ESNext,
              lib: ["es2020"],
              strict: true,
            });

            const libUri = "ts:filename/types.ts";
            const libSource = `
              type WrResponse<T> = { headers?: any; statusCode?: number; body?: T }
              type WrRequest<T> = { query: URLSearchParams; headers: any; id: string; body: T }
              interface ReducerFunction<State = any, ReqBody = any> {
                (state: State, req: WrRequest<ReqBody>, secrets: Record<string, string>): State 
              }
              interface ResponderFunction<ReqBody = any, ResBody = any> {
                (req: WrRequest<ReqBody>): WrResponse<ResBody> 
              }
              interface QueryFunction<State> {
                (state: State, queryParams: URLSearchParams, secrets: Record<string, string>): WrResponse<ResBody> 
              }
              declare global {
                function uuid(): string
                function toHex(uInt8: Uint8Array): string
                function sha256(input: string): Uint8Array
                function sha512(input: string): Uint8Array
                function hmac(hash: sha256 | sha512; key: string message: string): Uint8Array
              }
              function uuid(): string { return "" }
              function toHex(uInt8: Uint8Array): string { return "" }
              function sha256(input: string): Uint8Array { return new Uint8Array() }
              function sha512(input: string): Uint8Array { return new Uint8Array() }
              function hmac(hash: sha256 | sha512; key: string message: string): Uint8Array { return new Uint8Array() }
            `;

            monaco.languages.typescript.typescriptDefaults.addExtraLib(
              libSource,
              libUri
            );
            monaco.editor.createModel(
              libSource,
              "typescript",
              monaco.Uri.parse(libUri)
            );
            setIsSetup(true);
          }}
          defaultValue={hook.draft}
        />
      );
    case "diff":
      return (
        <DiffEditor
          original={hook.published}
          originalLanguage="typescript"
          modifiedLanguage="typescript"
          modified={hook.draft}
          options={{ ...options, renderSideBySide: false, readOnly: true }}
        />
      );
  }

  return null;
}

const FooterContainer: FC = ({ children }) => {
  return (
    <div className="border-t bg-canvas-50 py-0.5 px-3 flex flex-row content-between items-center text-xs">
      <div className="flex flex-row flex-1 space-x-2 items-center py-1">
        {children}
      </div>
      {/* 
        ideas for menu:
        - autopublish
        - recompute state?
      */}
    </div>
  );
};

export default function EditorAndFooter({ hook }: { hook: HookDetail }) {
  const { updateDraft, state } = useUpdateDraft({ hookId: hook.id });
  const { publish, state: publishState } = usePublish({ hookId: hook.id });
  const { setMode, mode } = useEditorMode();
  const { openDocs } = useContext(docsContext);
  const [editor, setEditor] = useState<any>();

  const tidy = useCallback(() => {
    if (!editor) {
      return;
    }
    editor.trigger("", "editor.action.formatDocument");
    editor.focus();
  }, [editor]);

  return (
    <>
      <EditorSwitch
        onInit={(editor) => setEditor(editor)}
        onChange={updateDraft}
        hook={hook}
        mode={mode}
      />
      <FooterContainer>
        <div></div>
        {hook.draft !== hook.published && (
          <button
            onClick={() =>
              mode === "diff" ? setMode("draft") : setMode("diff")
            }
          >
            View {mode === "diff" ? "draft" : "diff"}
          </button>
        )}
        <div className="flex-1" />
        <Button
          data-tour-id="docs"
          onClick={openDocs}
          size="xs"
          color="alternative"
        >
          <BookOpenIcon className="w-4 h-4 mr-1" />
          <span>Docs</span>
        </Button>
        <Button onClick={tidy} size="xs" color="alternative">
          <SparklesIcon className="w-4 h-4 mr-1" />
          <span>Tidy</span>
        </Button>
        {hook.published !== hook.draft && (
          <Tooltip
            // eslint-disable-next-line react/style-prop-object
            style="dark"
            className="max-w-sm"
            content={
              <p>
                Publishing the latest changes will re-run your code against all
                historical requests and recompute the latest state
              </p>
            }
          >
            <Button
              disabled={publishState === "submitting" || state === "submitting"}
              color="green"
              data-tour-id="publish-button"
              className="flex flex-row items-center"
              size="xs"
              onClick={publish}
            >
              <LightningBoltIcon className="w-4 h-4 mr-1" />
              <span>Publish</span>
            </Button>
          </Tooltip>
        )}
      </FooterContainer>
    </>
  );
}

type EditorModes = "diff" | "draft" | "published";
// @todo sync with query string??
function useEditorMode() {
  const [mode, setMode] = useState<EditorModes>("draft");
  return {
    setMode,
    mode,
  };
}

function useUpdateDraft({ hookId }: { hookId: string }) {
  const { submit, state } = useFetcher();
  const updateDraft = useCallback(
    debounce((value?: string) => {
      if (!value) {
        return;
      }
      if (
        value
          .split("\n")
          .every((line) => line.startsWith("//") || line.trim() === "")
      ) {
        return;
      }
      return submit(
        { code: value },
        { method: "post", action: `/hooks/${hookId}/update` }
      );
    }, 250),
    [submit, hookId]
  );

  return { updateDraft, state };
}

function usePublish({ hookId }: { hookId: string }) {
  const { submit, state } = useFetcher();
  const publish = useCallback(() => {
    return submit(null, { method: "post", action: `/hooks/${hookId}/publish` });
  }, [submit, hookId]);

  return { publish, state };
}
