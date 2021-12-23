import last from "lodash/last";
import React, {
  createContext,
  FC,
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ModalOpener } from ".";

type ModalControls = {
  pushModal: (modalOpener: ModalOpener) => void;
  popModal: () => void;
  closeModal: () => void;
};

const modalContext = createContext<ModalControls>({
  pushModal: () => {},
  popModal: () => {},
  closeModal: () => {},
});

export function useModals() {
  return useContext(modalContext);
}

const possibleModals: {
  [key: string]: (props: ModalOpener["props"]) => JSX.Element;
} = {};

export function registerModal<T extends keyof Modal.ModalTypes>(
  name: Modal.ModalTypes[T]["name"],
  modal: (props: Modal.ModalTypes[T]["props"]) => JSX.Element
) {
  possibleModals[name] = modal;
}

const ModalProvider: FC = ({ children }) => {
  const [modals, setModals] = useState<ModalOpener[]>([]);

  const pushModal = useCallback(
    (modalOpener: ModalOpener) => {
      setModals([...modals, modalOpener]);
    },
    [modals]
  );

  const closeModal = useCallback(() => {
    setModals([]);
  }, []);

  const popModal = useCallback(() => {
    const [, ...nextModals] = [...modals].reverse();
    setModals(nextModals);
  }, [modals]);

  const modalToRender = useMemo(() => {
    return last(modals);
  }, [modals]);

  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalToRender) {
        closeModal();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [closeModal, modalToRender]);

  const ModalComponent = modalToRender
    ? possibleModals[modalToRender?.name]
    : undefined;

  return (
    <modalContext.Provider value={{ pushModal, popModal, closeModal }}>
      {modalToRender && (
        <>
          <div
            className="fixed inset-0 z-10"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
          >
            <div
              aria-hidden="true"
              onClick={closeModal}
              className="bg-slate-700/75  fixed inset-0"
            />
            {/* @ts-ignore */}
            <ModalComponent {...modalToRender.props} />
          </div>
        </>
      )}
      {children}
    </modalContext.Provider>
  );
};

export default ModalProvider;
