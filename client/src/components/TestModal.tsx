import { registerModal } from "./ModalProvider";

export {};
type MODAL_NAME = "test";
const MODAL_NAME: MODAL_NAME = "test";

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

type Props = { text: string };

const TestModal = ({ text }: Props) => {
  return <div>foobar! {text}</div>;
};

registerModal<MODAL_NAME>(MODAL_NAME, TestModal);
