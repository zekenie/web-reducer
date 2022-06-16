import { NavLink } from "@remix-run/react";
import type { ComponentProps, FC, HTMLProps, ReactElement } from "react";

export const Tabs = ({
  children,
}: {
  children: ReactElement<TabProps> | ReactElement<TabProps>[];
}) => {
  return (
    <nav
      role="tablist"
      className="border-b bg-canvas-50 text-xs flex flex-row space-x-1 items-stretch"
    >
      {children}
    </nav>
  );
};

type TabProps = FC<{
  selected?: boolean;
  end?: ComponentProps<typeof NavLink>["end"];
  to?: string;
  onClick?: HTMLProps<HTMLButtonElement>["onClick"];
}>;

export const Tab: TabProps = ({ children, onClick, selected, end, to }) => {
  if (!to) {
    return (
      <button
        onClick={onClick}
        className={`py-2 px-2 ${
          selected
            ? "text-canvas-600 border-b-2 font-bold border-fern-900"
            : "text-canvas-400 hover:text-canvas-500"
        }`}
      >
        {children}
      </button>
    );
  }
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `py-2 px-2 ${
          isActive
            ? "text-canvas-600 border-b-2 font-bold border-fern-900"
            : "text-canvas-400 hover:text-canvas-500"
        }`
      }
    >
      {children}
    </NavLink>
  );
};
