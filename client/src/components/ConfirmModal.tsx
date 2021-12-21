import { registerModal } from "./ModalProvider";

export {};
type MODAL_NAME = "confirm";
const MODAL_NAME: MODAL_NAME = "confirm";

declare global {
  namespace Modal {
    interface ModalTypes {
      [MODAL_NAME]: {
        name: MODAL_NAME;
        props: Props;
      };
    }
  }
}

type Props = { text: string; faz: string };

const ConfirmModal = ({ text }: Props) => {
  return <div>confirm! {text}</div>;
};

registerModal<MODAL_NAME>(MODAL_NAME, ConfirmModal);
