import last from "lodash/last";
import React, {
  createContext,
  FC,
  ReactElement,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { ModalOpener } from "../modals";

type ModalControls = {
  pushModal: (modalOpener: ModalOpener) => void;
  popModal: () => void;
};

const modalContext = createContext<ModalControls>({
  pushModal: () => {},
  popModal: () => {},
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

  const popModal = useCallback(() => {
    const [, ...nextModals] = [...modals].reverse();
    setModals(nextModals);
  }, [modals]);

  const modalToRender = useMemo(() => {
    return last(modals);
  }, [modals]);

  const ModalComponent = modalToRender
    ? possibleModals[modalToRender?.name]
    : undefined;

  return (
    <modalContext.Provider value={{ pushModal, popModal }}>
      {modalToRender && (
        <>
          <div className="w-screen h-screen bg-slate-700 opacity-20" />
          {/* @ts-ignore */}
          <ModalComponent {...modalToRender.props} />
        </>
      )}
      {children}
    </modalContext.Provider>
  );
};

export default ModalProvider;
