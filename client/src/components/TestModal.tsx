import { registerModal } from "./ModalProvider";
import {
  CenteredModalContainer,
  ModalBody,
  ModalHeader,
} from "../modals/Content";

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
  return (
    <CenteredModalContainer>
      <ModalHeader title="Are you sure you really want to" />
      <ModalBody>foobar! {text}</ModalBody>
    </CenteredModalContainer>
  );
};

registerModal<MODAL_NAME>(MODAL_NAME, TestModal);
