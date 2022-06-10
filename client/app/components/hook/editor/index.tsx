import { DotsVerticalIcon } from "@heroicons/react/outline";
import Editor, { DiffEditor } from "@monaco-editor/react";
import { useFetcher } from "@remix-run/react";
import { debounce } from "lodash";
import { ComponentProps, FC, useEffect } from "react";
import { useCallback, useState } from "react";
import { Button, Tooltip } from "flowbite-react";
import type { HookDetail } from "~/remote/hook-client.server";

function EditorSwitch({
  hook,
  onChange,
  mode,
}: {
  mode: EditorModes;
  hook: HookDetail;
  onChange: ComponentProps<typeof Editor>["onChange"];
}) {
  const [isSetup, setIsSetup] = useState(false);
  const [monaco, setMonaco] = useState<any>();

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
      <div className="flex flex-row flex-1 space-x-2 items-center">
        {children}
      </div>
      {/* 
        ideas for menu:
        - autopublish
        - recompute state?
      */}
      <button
        // onClick={() =>
        //   pushModal({ name: "confirm", props: { text: "foo", faz: "sdf" } })
        // }
        className="p-3 hover:bg-canvas-50 rounded-full"
      >
        <DotsVerticalIcon className="w-3 h-3 self-center" />
      </button>
    </div>
  );
};

export default function EditorAndFooter({ hook }: { hook: HookDetail }) {
  const { updateDraft, state } = useUpdateDraft({ hookId: hook.id });
  const { publish, state: publishState } = usePublish({ hookId: hook.id });
  const { setMode, mode } = useEditorMode();

  return (
    <div className="flex-grow flex flex-col">
      <EditorSwitch onChange={updateDraft} hook={hook} mode={mode} />
      <FooterContainer>
        <div>{state}</div>
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
        {hook.published !== hook.draft && (
          <Tooltip
            style="dark"
            className="max-w-sm"
            content={
              <p>
                Publishing the latest changes will re-run your code against all
                historical requests and recompute the latest state
              </p>
            }
          >
            <Button color="green" size="xs" onClick={publish}>
              Publish
            </Button>
          </Tooltip>
        )}
      </FooterContainer>
    </div>
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
    debounce((value) => {
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
