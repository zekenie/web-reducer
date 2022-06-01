import { MenuIcon } from "@heroicons/react/outline";
import { FC, RefObject, useEffect, useState } from "react";
import { createContext, useContext, useRef } from "react";
import { createPortal } from "react-dom";

export const InsideHeader: FC = ({ children }) => {
  const ref = useRef<HTMLDivElement>();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    ref.current = document.querySelector<HTMLDivElement>("#center-nav")!;
    setMounted(true);
  }, []);

  return mounted ? createPortal(children, ref.current!) : null;
  // return createPortal(children, ref?.current || );
};

export const AppWithNav: FC = ({ children }) => {
  return (
    <>
      <header className="px-3 flex-shrink-0 py-3 border-b grid grid-cols-3">
        <div className="flex flex-row items-center space-x-4">
          <button
            // onClick={() =>
            //   pushModal({ name: "confirm", props: { text: "foo", faz: "sdf" } })
            // }
            className="p-3 hover:bg-canvas-50 rounded-full"
          >
            <MenuIcon className="w-7 h-7 self-center" />
          </button>

          <img className="w-56" alt="Hook Reducer" src="/logo.svg" />
        </div>
        <div id="center-nav" className="flex items-center justify-center">
          {/* <ResourceBar hook={hook} /> */}
        </div>
        <div />
      </header>
      {children}
    </>
  );
};
