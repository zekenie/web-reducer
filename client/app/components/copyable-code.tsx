import { ClipboardCopyIcon } from "@heroicons/react/outline";
import { FC, useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";

const CopyableCode: FC = ({ children }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const copy = useCallback(async () => {
    if (!contentRef.current) {
      return;
    }

    // this is a hacky way of working arround innerText
    // innerText treats all select options as valid, but hidden
    // spans as invalid
    function toggleSelects() {
      const placeholders =
        contentRef.current!.querySelectorAll(".placeholder-span");
      const selects = contentRef.current!.querySelectorAll("select");

      for (const placeholder of [...placeholders, ...selects]) {
        placeholder.classList.toggle("hidden");
      }
    }

    // this is for elements like a span containing the bash `$`
    function toggleVisibilityOfNoCopyElements() {
      for (const elem of contentRef.current!.querySelectorAll(".no-copy")) {
        elem.classList.toggle("hidden");
      }
    }

    toggleSelects();
    toggleVisibilityOfNoCopyElements();
    toast.success("It's on your clipboard", {
      icon: <ClipboardCopyIcon className="w-5 h-5 text-fern-600" />,
    });
    await navigator.clipboard.writeText(contentRef.current.innerText);
    toggleVisibilityOfNoCopyElements();
    toggleSelects();
  }, [contentRef]);
  return (
    <button
      onClick={copy}
      className="transform transition-transform duration-300 hover:-rotate-1 text-left border bg-sky-50 overflow-hidden relative  px-3 py-2 rounded"
    >
      <span
        onClick={copy}
        className="absolute bg-white  top-0 right-0 p-1 border-l border-b rounded-bl"
      >
        <ClipboardCopyIcon className="h-3.5 w-3.5" />
      </span>
      <div ref={contentRef} className="font-mono text-md">
        {children}
      </div>
    </button>
  );
};

export const VariableValue = ({
  id,
  initialValue,
}: {
  id: string;
  initialValue: string;
}) => (
  <span
    contentEditable
    suppressContentEditableWarning
    id={id}
    onClick={(e) => e.stopPropagation()}
    className="border-b-2 border-dashed  border-canvas-400 text-canvas-400"
  >
    {initialValue}
  </span>
);

export const VariableSelect = ({
  options,
  id,
  selected,
}: {
  selected?: string;
  id: string;
  options: string[];
}) => {
  const [val, setVal] = useState<string>(selected || "");
  return (
    <>
      <span className="hidden placeholder-span">{val}</span>
      <select
        id={id}
        style={{ width: 9.7 * val.length, backgroundImage: "none" }}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setVal(e.target.value)}
        className="bg-transparent border-l-0 border-r-0 border-t-0 p-0 appearance-none border-b-2 border-dashed  border-canvas-400 text-canvas-400"
      >
        {options.map((o) => (
          <option selected={selected === o} key={o}>
            {o}
          </option>
        ))}
      </select>
    </>
  );
};

export default CopyableCode;
