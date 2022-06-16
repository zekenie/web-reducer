import { last, times } from "lodash";
import type { editor } from "monaco-editor";
import { Selection } from "monaco-editor";

// type EditorType = ReturnType<typeof editor.create>

type Vector = {
  column: number;
  line: number;
};

type TextEntryMode = "paste" | "type";

// ideas:
// - navigate
// - highlight
// - button for OK on cursor's aprox position

type Content =
  | {
      text: string;
      type: "text";
      mode: TextEntryMode;
    }
  | {
      text: string;
      type: "line";
      mode: TextEntryMode;
    }
  | { type: "pause"; ms: number }
  | { type: "delete"; amount: number }
  | { type: "reposition"; vector: Vector }
  | { type: "navigate"; path: string }
  | { type: "highlight"; selector: string; moveOnAfter?: number };

function vectorDeltaForText(text: string): Vector {
  if (text.length === 0) {
    return { line: 0, column: 0 };
  }
  const lines = text.split("\n");

  return {
    line: lines.length - 1,
    column: last(lines)!.length + 1,
  };
}

async function sleep(ms: number) {
  // return;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function addVectors(vector1: Vector, vector2: Vector): Vector {
  return {
    line: vector1.line + vector2.line,
    column: vector1.column + vector2.column,
  };
}

class TutorialContentManager {
  private cursorPosition: Vector = { column: 0, line: 1 };
  private oldDecorationIds: string[] = [];
  private state: "running" | "stopped" | "idle" = "stopped";
  private contentQueue: Content[] = [];
  constructor(
    private readonly editor: editor.IStandaloneCodeEditor,
    private readonly model: editor.ITextModel,
    private readonly navigate: (url: string) => void
  ) {
    // this.editor.
  }

  public async start() {
    console.log("start called");
    if (this.state === "running") {
      return;
    }
    this.state = "running";
    while (this.contentQueue.length) {
      const queueItem = this.contentQueue.shift();
      if (!queueItem) {
        return;
      }
      switch (queueItem.type) {
        case "line":
          await this.insertText({
            line: true,
            text: queueItem.text,
            mode: queueItem.mode,
          });
          break;
        case "text":
          await this.insertText({ text: queueItem.text, mode: queueItem.mode });
          break;
        case "pause":
          await sleep(queueItem.ms);
          break;
        case "navigate":
          this.navigate(queueItem.path);
          break;
        case "highlight":
          await this.highlight(queueItem.selector, queueItem.moveOnAfter);
      }
    }
    this.state = "idle";
  }

  private async highlight(selector: string, moveOnAfter: number = 5000) {
    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => resolve(), moveOnAfter);
      const elem = document.querySelector(selector);
      if (!elem) {
        console.log("no id found for", selector);
        return;
      }
      document.querySelector(".tour-callout")?.classList.remove("tour-callout");
      elem.classList.add("tour-callout");
      function onClick(this: HTMLElement) {
        resolve();
        clearTimeout(timer);
        this.removeEventListener("click", onClick);
      }
      elem.addEventListener("click", onClick);
    });
  }

  private moveCursor(deltaVector: Vector) {
    this.cursorPosition = addVectors(this.cursorPosition, deltaVector);
    this.oldDecorationIds = this.editor.deltaDecorations(
      this.oldDecorationIds,
      [
        {
          range: this.monacoSelectionForVector,
          options: {
            // inlineClassName: "tutorial-cursor",
            afterContentClassName: "tutorial-cursor",
          },
        },
      ]
    );
  }

  private async insertText({
    text,
    line,
    mode,
  }: {
    text: string;
    line?: boolean;
    mode: TextEntryMode;
  }) {
    if (line && this.cursorPosition.line + this.cursorPosition.column > 1) {
      // text = "\n" + text;
      await this.insertText({ text: "\n", line: false, mode: "paste" });
    }
    switch (mode) {
      case "paste":
        this.model.applyEdits([{ range: this.monacoSelectionForVector, text }]);
        this.moveCursor(vectorDeltaForText(text));
        break;
      case "type":
        for (const char of text) {
          await this.insertText({ text: char, line: false, mode: "paste" });
          await sleep(40 + Math.random() * 10);
        }
        break;
    }
  }

  get monacoSelectionForVector() {
    return new Selection(
      this.cursorPosition.line,
      this.cursorPosition.column,
      this.cursorPosition.line,
      this.cursorPosition.column
    );
  }

  public async enqueueContent(item: Content) {
    this.contentQueue.push(item);
    if (this.state === "idle") {
      await this.start();
    }
  }
}

export default function startTutorial({
  editor,
  navigate,
  model,
}: {
  editor: editor.IStandaloneCodeEditor;
  model: editor.ITextModel;
  navigate: (path: string) => void;
}) {
  const manager = new TutorialContentManager(editor, model, navigate);

  manager.enqueueContent({
    type: "line",
    text: "// 👋 **WELCOME** to WebReducer",
    mode: "type",
  });
  manager.enqueueContent({
    type: "line",
    text: "",
    mode: "type",
  });

  manager.enqueueContent({ type: "pause", ms: 500 });
  manager.enqueueContent({
    type: "line",
    text: "// WebReducer gives you an endpoint and a programmable reducer function.",
    mode: "type",
  });
  manager.enqueueContent({ type: "pause", ms: 750 });

  manager.enqueueContent({
    type: "line",
    text: "// It's a _stateful_ cloud function.",
    mode: "type",
  });
  manager.enqueueContent({ type: "pause", ms: 750 });
  manager.enqueueContent({
    type: "text",
    text: " Perfect for:",
    mode: "type",
  });
  manager.enqueueContent({ type: "pause", ms: 750 });
  manager.enqueueContent({
    type: "line",
    text: "",
    mode: "paste",
  });
  manager.enqueueContent({
    type: "line",
    text: "// - webhooks",
    mode: "paste",
  });
  manager.enqueueContent({ type: "pause", ms: 750 });
  manager.enqueueContent({
    type: "line",
    text: "// - prototypes",
    mode: "paste",
  });
  manager.enqueueContent({ type: "pause", ms: 750 });
  manager.enqueueContent({
    type: "line",
    text: "// - personal software",
    mode: "paste",
  });
  manager.enqueueContent({ type: "pause", ms: 750 });
  manager.enqueueContent({
    type: "line",
    text: "// - honestly lots of things I haven't thought of yet",
    mode: "paste",
  });

  manager.enqueueContent({ type: "pause", ms: 750 });
  manager.enqueueContent({
    type: "line",
    text: "\n// OK! Let's make some requests to your endpoint",
    mode: "type",
  });

  manager.enqueueContent({
    type: "highlight",
    selector: `[data-tour-id="lazy-button"]`,
  });
  manager.enqueueContent({ type: "pause", ms: 500 });

  manager.enqueueContent({
    type: "line",
    text: "",
    mode: "paste",
  });

  manager.enqueueContent({
    type: "line",
    text: "// Nice. You made requests. Now let's see what we can do with it",
    mode: "type",
  });

  manager.enqueueContent({
    type: "line",
    text: "",
    mode: "type",
  });

  manager.enqueueContent({
    type: "line",
    text: `const reducer: ReducerFunction = (prevState = { number: 0, prevRequests: [] }, req) => {
  return {
    number: prevState.number + 1,
    prevRequests: [...prevState.prevRequests, req.body]
  }
}`,
    mode: "paste",
  });
  manager.enqueueContent({ type: "pause", ms: 750 });

  manager.enqueueContent({
    type: "highlight",
    selector: `[data-tour-id="publish-button"]`,
  });
  manager.enqueueContent({ type: "pause", ms: 500 });

  manager.enqueueContent({
    type: "line",
    text: "",
    mode: "type",
  });

  manager.enqueueContent({ type: "pause", ms: 250 });

  manager.enqueueContent({
    type: "line",
    text: "// check it out! the state has been updated after the fact!",
    mode: "type",
  });

  manager.enqueueContent({
    type: "highlight",
    selector: `[data-tour-id="state-cell"]`,
    moveOnAfter: 2500,
  });

  manager.enqueueContent({
    type: "highlight",
    selector: `[data-tour-id="keys-link"]`,
    moveOnAfter: 500,
  });

  manager.enqueueContent({ type: "pause", ms: 500 });

  manager.enqueueContent({
    type: "navigate",
    path: "./keys",
  });
  manager.enqueueContent({ type: "pause", ms: 500 });

  manager.enqueueContent({
    type: "highlight",
    selector: `[data-tour-id="read-key-copy-link"]`,
    moveOnAfter: 1500,
  });

  manager.enqueueContent({ type: "pause", ms: 250 });

  manager.enqueueContent({
    type: "line",
    text: "",
    mode: "type",
  });

  manager.enqueueContent({
    type: "line",
    text: "// Copy the read key to your clipboard paste it into your browser...",
    mode: "type",
  });

  manager.enqueueContent({ type: "pause", ms: 550 });

  manager.enqueueContent({
    type: "line",
    text: "",
    mode: "type",
  });

  manager.enqueueContent({
    type: "line",
    text: "// For more info, check out the docs...",
    mode: "type",
  });

  manager.enqueueContent({
    type: "highlight",
    selector: `[data-tour-id="docs"]`,
    moveOnAfter: 2500,
  });

  manager.start();
}
