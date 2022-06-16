import { MenuIcon } from "@heroicons/react/outline";
import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import type { UserDetails } from "../../remote/auth-client.server";
import GithubIcon from "./github-icon";
import UserButton from "./user-button";

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

export const AppWithNav: FC<{ userDetails: UserDetails }> = ({
  userDetails,
  children,
}) => {
  return (
    <>
      <header className="px-3 flex-shrink-0 py-3 border-b grid grid-cols-3">
        <div className="flex flex-row items-center space-x-4">
          <div />
          {/* <button
            // onClick={() =>
            //   pushModal({ name: "confirm", props: { text: "foo", faz: "sdf" } })
            // }
            className="p-3 hover:bg-canvas-50 rounded-full"
          >
            <MenuIcon className="w-7 h-7 self-center" />
          </button> */}

          <Link to="/">
            <img className="w-56" alt="Hook Reducer" src="/logo.svg" />
          </Link>
        </div>
        <div id="center-nav" className="flex items-center justify-center" />
        <div className="flex justify-end flex-row items-center space-x-4">
          <a
            href="https://github.com/zekenie/web-reducer"
            className="text-canvas-400 hover:text-canvas-500"
            target="_blank"
            rel="noreferrer"
          >
            <GithubIcon width={26} />
          </a>
          <UserButton userDetails={userDetails} />
        </div>
      </header>
      {children}
    </>
  );
};
