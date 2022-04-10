import React from "react";
import { KBarResults, useMatches } from "kbar";
import ResultItem from "./ResultItem";

function RenderResults() {
  const { results, rootActionId } = useMatches();

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) =>
        typeof item === "string" ? (
          <div className="opacity-50 text-xs flex flex-row items-center py-2 px-4 uppercase">
            {item}
          </div>
        ) : (
          <ResultItem
            action={item}
            active={active}
            currentRootActionId={rootActionId!}
          />
        )
      }
    />
  );
}

export default RenderResults;
