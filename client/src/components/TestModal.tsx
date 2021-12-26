import { registerModal } from "../modals/ModalProvider";
import {
  CenteredModalContainer,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "../modals/Content";

export type MODAL_NAME = "test";
export const MODAL_NAME: MODAL_NAME = "test";

declare global {
  namespace Modal {
    interface ModalTypes {
      [MODAL_NAME]: {
        name: MODAL_NAME;
        props: Props;
        resolveValue: string;
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
      <ModalFooter>Footer goes here</ModalFooter>
    </CenteredModalContainer>
  );
};

registerModal<MODAL_NAME>(MODAL_NAME, TestModal);
