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
              interface QueryFunction<State = any, ResBody = any> {
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

              function validateJsonSchema(schema: UncheckedJSONSchemaType, data: unknown): { valid: boolean; errors: ErrorObject[] }

              interface ErrorObject<K extends string = string, P = Record<string, any>, S = unknown> {
                  keyword: K;
                  instancePath: string;
                  schemaPath: string;
                  params: P;
                  propertyName?: string;
                  message?: string;
                  schema?: S;
                  parentSchema?: unknown;
                  data?: unknown;
              }

              declare type UncheckedPartialSchema<T> = Partial<UncheckedJSONSchemaType<T, true>>;
              declare type UnionToIntersection<U> = (U extends any ? (_: U) => void : never) extends (_: infer I) => void ? I : never;
              declare type JSONType<T extends string, IsPartial extends boolean> = IsPartial extends true ? T | undefined : T;
              interface NumberKeywords {
                minimum?: number;
                maximum?: number;
                exclusiveMinimum?: number;
                exclusiveMaximum?: number;
                multipleOf?: number;
                format?: string;
              }
              interface StringKeywords {
                minLength?: number;
                maxLength?: number;
                pattern?: string;
                format?: string;
              }
              declare type Known = {
                [key: string]: Known;
              } | [Known, ...Known[]] | Known[] | number | string | boolean | null;
              declare type Nullable<T> = undefined extends T ? {
                nullable: true;
                const?: null;
                enum?: Readonly<(T | null)[]>;
                default?: T | null;
              } : {
                const?: T;
                enum?: Readonly<T[]>;
                default?: T;
              };
              declare type UncheckedPropertiesSchema<T> = {
                [K in keyof T]-?: (UncheckedJSONSchemaType<T[K], false> & Nullable<T[K]>) | {
                    $ref: string;
                };
              };
              declare type UncheckedRequiredMembers<T> = {
                [K in keyof T]-?: undefined extends T[K] ? never : K;
              }[keyof T];
              declare type UncheckedJSONSchemaType<T, IsPartial extends boolean> = (// these two unions allow arbitrary unions of types
              {
                  anyOf: readonly UncheckedJSONSchemaType<T, IsPartial>[];
              } | {
                  oneOf: readonly UncheckedJSONSchemaType<T, IsPartial>[];
              } | ({
                  type: readonly (T extends number ? JSONType<"number" | "integer", IsPartial> : T extends string ? JSONType<"string", IsPartial> : T extends boolean ? JSONType<"boolean", IsPartial> : never)[];
              } & UnionToIntersection<T extends number ? NumberKeywords : T extends string ? StringKeywords : T extends boolean ? {} : never>) | ((T extends number ? {
                  type: JSONType<"number" | "integer", IsPartial>;
              } & NumberKeywords : T extends string ? {
                  type: JSONType<"string", IsPartial>;
              } & StringKeywords : T extends boolean ? {
                  type: JSONType<"boolean", IsPartial>;
              } : T extends readonly [any, ...any[]] ? {
                  type: JSONType<"array", IsPartial>;
                  items: {
                      readonly [K in keyof T]-?: UncheckedJSONSchemaType<T[K], false> & Nullable<T[K]>;
                  } & {
                      length: T["length"];
                  };
                  minItems: T["length"];
              } & ({
                  maxItems: T["length"];
              } | {
                  additionalItems: false;
              }) : T extends readonly any[] ? {
                  type: JSONType<"array", IsPartial>;
                  items: UncheckedJSONSchemaType<T[0], false>;
                  contains?: UncheckedPartialSchema<T[0]>;
                  minItems?: number;
                  maxItems?: number;
                  minContains?: number;
                  maxContains?: number;
                  uniqueItems?: true;
                  additionalItems?: never;
              } : T extends Record<string, any> ? {
                  type: JSONType<"object", IsPartial>;
                  additionalProperties?: boolean | UncheckedJSONSchemaType<T[string], false>;
                  unevaluatedProperties?: boolean | UncheckedJSONSchemaType<T[string], false>;
                  properties?: IsPartial extends true ? Partial<UncheckedPropertiesSchema<T>> : UncheckedPropertiesSchema<T>;
                  patternProperties?: Record<string, UncheckedJSONSchemaType<T[string], false>>;
                  propertyNames?: Omit<UncheckedJSONSchemaType<string, false>, "type"> & {
                      type?: "string";
                  };
                  dependencies?: {
                      [K in keyof T]?: Readonly<(keyof T)[]> | UncheckedPartialSchema<T>;
                  };
                  dependentRequired?: {
                      [K in keyof T]?: Readonly<(keyof T)[]>;
                  };
                  dependentSchemas?: {
                      [K in keyof T]?: UncheckedPartialSchema<T>;
                  };
                  minProperties?: number;
                  maxProperties?: number;
              } & (IsPartial extends true ? {
                  required: Readonly<(keyof T)[]>;
              } : [UncheckedRequiredMembers<T>] extends [never] ? {
                  required?: Readonly<UncheckedRequiredMembers<T>[]>;
              } : {
                  required: Readonly<UncheckedRequiredMembers<T>[]>;
              }) : T extends null ? {
                  type: JSONType<"null", IsPartial>;
                  nullable: true;
              } : never) & {
                  allOf?: Readonly<UncheckedPartialSchema<T>[]>;
                  anyOf?: Readonly<UncheckedPartialSchema<T>[]>;
                  oneOf?: Readonly<UncheckedPartialSchema<T>[]>;
                  if?: UncheckedPartialSchema<T>;
                  then?: UncheckedPartialSchema<T>;
                  else?: UncheckedPartialSchema<T>;
                  not?: UncheckedPartialSchema<T>;
              })) & {
                  [keyword: string]: any;
                  $id?: string;
                  $ref?: string;
                  $defs?: Record<string, UncheckedJSONSchemaType<Known, true>>;
                  definitions?: Record<string, UncheckedJSONSchemaType<Known, true>>;
              };

              function validateJsonTypeDef(schema: JtdSchema, data: unknown): { valid: boolean; errors: JtdValidationError[] }

              interface JtdValidationError {
                /**
                 * instancePath is the path to a part of the instance, or "input", that was
                 * rejected.
                 */
                instancePath: string[];
                /**
                 * schemaPath is the path to the part of the schema that rejected the input.
                 */
                schemaPath: string[];
            }

              /**
               * Schema is a TypeScript representation of a correct JSON Typedef schema.
               *
               * The JSON Typedef specification allows schemas to take on one of eight forms.
               * Each of those forms has its own type in this module; Schema is simply a union
               * of each of those eight types.
               */
              declare type JtdSchema = JtdSchemaFormEmpty | JtdSchemaFormRef | JtdSchemaFormType | JtdSchemaFormEnum | JtdSchemaFormElements | JtdSchemaFormProperties | JtdSchemaFormValues | JtdSchemaFormDiscriminator;
              /**
               * JtdSchemaFormEmpty represents Jtdschemas of the empty form.
               */
              declare type JtdSchemaFormEmpty = SharedFormProperties;
              /**
               * JtdSchemaFormRef represents Jtdschemas of the ref form.
               */
              declare type JtdSchemaFormRef = SharedFormProperties & {
                  ref: string;
              };
              /**
               * JtdSchemaFormType represents Jtdschemas of the type form.
               */
              declare type JtdSchemaFormType = SharedFormProperties & {
                  type: Type;
              };
              /**
               * Type represents the legal values of the "type" keyword in JSON Typedef.
               */
              declare type Type = "boolean" | "float32" | "float64" | "int8" | "uint8" | "int16" | "uint16" | "int32" | "uint32" | "string" | "timestamp";
              /**
               * JtdSchemaFormEnum represents Jtdschemas of the enum form.
               */
              declare type JtdSchemaFormEnum = SharedFormProperties & {
                  enum: string[];
              };
              /**
               * JtdSchemaFormElements represents Jtdschemas of the elements form.
               */
              declare type JtdSchemaFormElements = SharedFormProperties & {
                  elements: JtdSchema;
              };
              /**
               * JtdSchemaFormProperties represents Jtdschemas of the properties form.
               */
              declare type JtdSchemaFormProperties = SharedFormProperties & ({
                  properties?: {
                      [name: string]: JtdSchema;
                  };
                  optionalProperties: {
                      [name: string]: JtdSchema;
                  };
                  additionalProperties?: boolean;
              } | {
                  properties: {
                      [name: string]: JtdSchema;
                  };
                  optionalProperties?: {
                      [name: string]: JtdSchema;
                  };
                  additionalProperties?: boolean;
              });
              /**
               * JtdSchemaFormValues represents Jtdschemas of the values form.
               */
              declare type JtdSchemaFormValues = SharedFormProperties & {
                  values: JtdSchema;
              };
              /**
               * JtdSchemaFormDiscriminator represents Jtdschemas of the discriminator form.
               */
              declare type JtdSchemaFormDiscriminator = SharedFormProperties & {
                  discriminator: string;
                  mapping: {
                      [name: string]: JtdSchema;
                  };
              };
              /**
               * SharedFormProperties contains the properties shared among all Jtdschema forms.
               */
              interface SharedFormProperties {
                  definitions?: {
                      [definition: string]: JtdSchema;
                  };
                  metadata?: {
                      [name: string]: unknown;
                  };
                  nullable?: boolean;
              }
            `;

            monaco.languages.typescript.typescriptDefaults.addExtraLib(
              libSource,
              libUri
            );
            monaco.editor
              .createModel(libSource, "typescript", monaco.Uri.parse(libUri))
              .updateOptions({ tabSize: 2 });

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
