import {
  CenteredModalContainer,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "./modals/Content";
import { registerModal } from "./modals/ModalProvider";

export type MODAL_NAME = "test";
// eslint-disable-next-line @typescript-eslint/no-redeclare
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

export function register() {
  registerModal<MODAL_NAME>(MODAL_NAME, TestModal);
}
