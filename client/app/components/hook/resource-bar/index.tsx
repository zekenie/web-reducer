import { Popover, Transition } from "@headlessui/react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  InboxInIcon,
  KeyIcon,
} from "@heroicons/react/outline";
import { Fragment, useCallback, useEffect, useState } from "react";
import type { HookDetail } from "~/remote/hook-client.server";
import { useSocket } from "~/routes/hooks/$hookId";
import type { SocketMessage } from "~/socket-messages.types";
import DetailsForm from "./details-form";
import { Tab, Tabs } from "~/components/tabs";
import { useFetcher } from "@remix-run/react";
import { Button } from "flowbite-react";
import { useModals } from "~/modals/lib/modal-provider";

export function formatNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  }
  if (num < 100_000) {
    return (num / 1000).toPrecision(4) + "K";
  }
  if (num < 1_000_000) {
    return (num / 1000).toPrecision(3) + "K";
  }

  if (num < 1_000_000_00) {
    return (num / 1_000_000).toPrecision(2) + "M";
  }

  if (num < 1_000_000_000) {
    return (num / 1_000_000).toPrecision(3) + "M";
  }
  return "literally so much";
}

function ResourceBar({ hook }: { hook: HookDetail }) {
  const [requestCount, setRequestCount] = useState(hook.requestCount);
  const [tab, setTab] = useState<"details" | "danger-zone">("details");
  const { latestEvent } = useSocket<SocketMessage>();
  const fetcher = useFetcher();
  const { pushModal } = useModals();

  const deleteHook = useCallback(async () => {
    const confirmed = await pushModal({
      name: "confirm",
      props: {
        title: "Are you SURE?",
        body: "This code and all data will be PERMANENTLY deleted",
        confirmText: "Destroy it",
      },
    });

    if (!confirmed) {
      return;
    }

    fetcher.submit(null, {
      method: "post",
      action: `/hooks/${hook.id}/delete`,
    });
  }, [fetcher, hook.id, pushModal]);

  useEffect(() => {
    if (latestEvent) {
      if (latestEvent.type === "new-request") {
        setRequestCount(latestEvent.requestCount);
      }
    }
  }, [latestEvent]);

  return (
    <Popover className="relative">
      {({ open }) => (
        <div className={open ? "shadow-lg" : ""}>
          <Popover.Button
            className={`font-mono flex-1 itens-center ${
              open ? "rounded-t" : "rounded"
            } bg-canvas-50 hover:bg-canvas-100 text-canvas-500 cursor-pointer border p-2 cursor-no flex space-x-2`}
          >
            <ChevronRightIcon className="w-4 h-4 self-center" />

            <div className="font-mono">{hook.name}</div>

            <div className="flex-1 w-24" />
            <div className="bg-fern-500 h-2 w-2 rounded-full self-center"></div>
            <div className="flex border items-center space-x-1 flex-row text-canvas-400 px-2 p-1 rounded text-xs font-bold">
              <InboxInIcon className="w-4 h-4 self-center" />
              <div className="self-center">{formatNumber(requestCount)}</div>
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
              <div className="shadow-lg space-y-2 text-xs overflow-hidden rounded-b h-72 bg-slate-50 border-x border-b">
                <Tabs>
                  <Tab
                    onClick={() => setTab("details")}
                    selected={tab === "details"}
                  >
                    Details
                  </Tab>
                  <Tab
                    onClick={() => setTab("danger-zone")}
                    selected={tab === "danger-zone"}
                  >
                    Danger zone
                  </Tab>
                </Tabs>
                <div className="m-2">
                  {tab === "details" && <DetailsForm />}
                  {tab === "danger-zone" && (
                    <Button onClick={deleteHook} color="red">
                      Delete!
                    </Button>
                  )}
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </div>
      )}
    </Popover>
  );
}

export default ResourceBar;
