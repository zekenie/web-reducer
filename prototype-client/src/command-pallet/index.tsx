import {
  Action,
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarSearch,
} from "kbar";
import React, { FC } from "react";
import RenderResults from "./RenderResults";

const searchStyle = {
  padding: "12px 16px",
  fontSize: "16px",
  width: "100%",
  boxSizing: "border-box" as React.CSSProperties["boxSizing"],
  outline: "none",
};

const animatorStyle = {
  maxWidth: "600px",
  width: "100%",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "var(--shadow)",
};

const actions: Action[] = [
  {
    id: "all-hooks",
    name: "All Hooks",

    shortcut: ["a"],
    section: "navigation",
    keywords: "where you see the list of your hooks",
    perform: () => (window.location.pathname = "hooks"),
  },
  {
    id: "support",
    name: "Supprt",
    shortcut: ["s"],
    section: "navigation",
    keywords: "email",
    perform: () => (window.location.pathname = "support"),
  },
];

const CommandPallet: FC = ({ children }) => {
  return (
    <KBarProvider actions={actions}>
      <KBarPortal>
        <KBarPositioner className="bg-[rgba(0,0,0,0.4)]">
          <KBarAnimator
            className="bg-white divide-y drop-shadow-lg ring-2 ring-offset-1 ring-offset-slate-700 shadow-lg"
            style={animatorStyle}
          >
            <KBarSearch className="bg-white" style={searchStyle} />
            <RenderResults />
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </KBarProvider>
  );
};

export default CommandPallet;
