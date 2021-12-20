import React, { FC, ReactElement } from "react";

export const Tabs = ({
  children,
}: {
  children: ReactElement<TabProps> | ReactElement<TabProps>[];
}) => {
  const selectedChild = React.useMemo(() => {}, [children]);
  return (
    <nav
      role="tablist"
      className="border-b bg-canvas-50 text-xs flex flex-row space-x-1 items-stretch"
    >
      {children}
    </nav>
  );
};

type TabProps = FC<{ selected?: boolean }>;

export const Tab: TabProps = ({ children, selected = false }) => {
  return (
    <a
      href=""
      className={`py-2 px-2 ${
        selected
          ? "text-canvas-600 border-b-2 font-bold border-fern-900"
          : "text-canvas-400 hover:text-canvas-500"
      }`}
    >
      {children}
    </a>
  );
};
