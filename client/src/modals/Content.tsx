import { XIcon } from "@heroicons/react/outline";
import React, { FC } from "react";
import { useModals } from "../components/ModalProvider";

export const ModalHeader: FC<{ title: string }> = ({ title }) => {
  const { closeModal } = useModals();
  return (
    <div
      id="modal-title"
      className="p-2 border-b items-center flex-shrink-0 flex flex-row justify-between"
    >
      <div className="w-8" />
      <div className="truncate font-semibold">{title}</div>
      <div className="w-8 flex justify-center">
        <button onClick={closeModal} className="hover:bg-slate-200 p-1 rounded">
          <XIcon className="w-h h-5" />
        </button>
      </div>
    </div>
  );
};

export const ModalBody: FC = ({ children }) => {
  return <div className="p-2 overflow-y-auto">{children}</div>;
};

export const ModalFooter: FC = ({ children }) => {
  return (
    <div className="px-2 py-1 flex flex-row justify-end border-t bg-sky-100 space-x-2">
      {children}
    </div>
  );
};

export const CenteredModalContainer: FC = ({ children }) => {
  return (
    <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
      <div className="pointer-events-auto max-w-2xl w-full rounded-lg drop-shadow-lg bg-white flex flex-col overflow-y-none max-h-96 overflow-hidden">
        {children}
      </div>
    </div>
  );
};
