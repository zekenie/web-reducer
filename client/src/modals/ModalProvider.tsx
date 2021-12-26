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
  pushModal: <T extends keyof Modal.ModalTypes>(
    modalOpener: ModalOpener
  ) => Promise<Modal.ModalTypes[T]["resolveValue"]>;
  popModal: <T extends keyof Modal.ModalTypes>(
    resolveValue?: Modal.ModalTypes[T]["resolveValue"]
  ) => void;
  closeModal: <T extends keyof Modal.ModalTypes>(
    resolveValue?: Modal.ModalTypes[T]["resolveValue"]
  ) => void;
};

const modalContext = createContext<ModalControls>({
  // @ts-ignore
  pushModal: () => Promise.resolve(),
  popModal: <T extends keyof Modal.ModalTypes>(
    resolveValue?: Modal.ModalTypes[T]["resolveValue"]
  ) => {},
  closeModal: <T extends keyof Modal.ModalTypes>(
    resolveValue?: Modal.ModalTypes[T]["resolveValue"]
  ) => {},
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
  const [modalStack, setModalStack] = useState<ModalOpener[]>([]);
  const [resolveStack, setResolveStack] = useState<((value: any) => unknown)[]>(
    []
  );

  const pushModal = useCallback(
    <T extends keyof Modal.ModalTypes>(modalOpener: ModalOpener) => {
      setModalStack([...modalStack, modalOpener]);
      return new Promise<Modal.ModalTypes[T]["resolveValue"]>((resolve) => {
        setResolveStack([...resolveStack, resolve]);
      });
    },
    [modalStack]
  );

  const lastResolve = useMemo(() => last(resolveStack)!, []);

  const closeModal = useCallback(
    <T extends keyof Modal.ModalTypes>(
      resolveValue?: Modal.ModalTypes[T]["resolveValue"]
    ) => {
      lastResolve(resolveValue);
      setModalStack([]);
      setResolveStack([]);
    },
    [lastResolve]
  );

  const popModal = useCallback(
    <T extends keyof Modal.ModalTypes>(
      resolveValue?: Modal.ModalTypes[T]["resolveValue"]
    ) => {
      lastResolve(resolveValue);
      const [, ...nextModals] = [...modalStack].reverse();
      const [, ...nextResolveStack] = [...resolveStack].reverse();
      setModalStack(nextModals);
      setResolveStack(nextResolveStack);
    },
    [modalStack, resolveStack]
  );

  const modalToRender = useMemo(() => {
    return last(modalStack);
  }, [modalStack]);

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
              onClick={() => closeModal()}
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
