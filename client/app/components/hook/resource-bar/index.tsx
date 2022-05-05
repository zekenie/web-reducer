import {
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardCopyIcon,
  InboxInIcon,
  KeyIcon,
} from "@heroicons/react/outline";
import type { HookDetail } from "~/remote/hook-client.server";
import { Popover, Transition } from "@headlessui/react";
import { Fragment } from "react";

function CopyableToken({ token }: { token: string }) {
  return (
    <button className="flex items-center overflow-hidden flex-row rounded-sm w-fit font-mono">
      <div className="pl-0.5 pr-1.5 py-0.5  bg-gold-200 bg-">{token}</div>
      <div className="px-0.5 py-0.5  self-stretch bg-gold-300 ">
        <ClipboardCopyIcon className="w-4 h-4" />
      </div>
    </button>
  );
}

function ResourceBar({ hook }: { hook: HookDetail }) {
  return (
    <Popover className="relative">
      {({ open }) => (
        <div className={open ? "shadow-lg" : ""}>
          <Popover.Button
            className={`font-mono flex-1 itens-center ${
              open ? "rounded-t" : "rounded"
            } bg-canvas-50 hover:bg-canvas-100 text-canvas-500 cursor-pointer border p-2 cursor-no flex space-x-2`}
          >
            <div className="bg-sky-500 text-white p-1 rounded flex items-center justify-center text-xs font-bold">
              your-hooks
            </div>
            <ChevronRightIcon className="w-4 h-4 self-center" />

            <div className="font-mono">{hook.name}</div>

            <div className="flex-1" />
            <div className="bg-fern-500 h-2 w-2 rounded-full self-center"></div>
            <div className="flex border items-center space-x-1 flex-row text-canvas-400 px-2 p-1 rounded text-xs font-bold">
              <InboxInIcon className="w-4 h-4 self-center" />
              <div className="self-center">1.2k</div>
            </div>
            <div className="flex border items-center space-x-1 flex-row text-canvas-400 px-2 p-1 rounded text-xs font-bold">
              <KeyIcon className="w-4 h-4 self-center" />
              <div className="self-center">
                {hook.readKeys.length + hook.writeKeys.length}
              </div>
            </div>
            <ChevronDownIcon className="w-4 h-4 self-center" />
          </Popover.Button>
          <Transition
            as={Fragment}
            // enter="transition ease-out duration-200"
            // enterFrom="opacity-0 translate-y-1"
            // enterTo="opacity-100 translate-y-0"
            // leave="transition ease-in duration-150"
            // leaveFrom="opacity-100 translate-y-0"
            // leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute left-1/2 z-10 w-full max-w-md -translate-x-1/2 transform px-4 sm:px-0 lg:max-w-3xl">
              <div className="shadow-lg space-y-2 text-xs overflow-hidden rounded-b h-64 bg-slate-50 p-2 border-x border-b">
                <section>
                  <h2 className="font-bold">Read keys</h2>
                  <div className="flex flex-col space-y-1">
                    {hook.readKeys.map((key) => (
                      <CopyableToken key={key} token={key} />
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="font-bold">Write keys</h2>
                  <div className="flex flex-col space-y-1">
                    {hook.writeKeys.map((key) => (
                      <CopyableToken key={key} token={key} />
                    ))}
                  </div>
                </section>
              </div>
            </Popover.Panel>
          </Transition>
        </div>
      )}
    </Popover>
  );
}

export default ResourceBar;
