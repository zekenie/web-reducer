import { registerModal } from "../modals/ModalProvider";
import {
  CenteredModalContainer,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "../modals/Content";

type MODAL_NAME = "confirm";
const MODAL_NAME: MODAL_NAME = "confirm";

declare global {
  namespace Modal {
    interface ModalTypes {
      [MODAL_NAME]: {
        name: MODAL_NAME;
        props: Props;
        resolveValue: number;
      };
    }
  }
}

type Props = { text: string; faz: string };

const ConfirmModal = ({ text }: Props) => {
  return (
    <CenteredModalContainer>
      <ModalHeader title="Are you sure you really want to" />
      <ModalBody>
        confirm! {text}
        <p>test</p>
        <p>test</p>
        <p>test</p>
        <p>test</p>
        <p>test</p>
        <p>test</p>
        <p>test</p>
        <p>test</p>
        <p>test</p>
        <p>test</p>
        <p>test</p>
      </ModalBody>
      <ModalFooter>
        <button className="rounded p-2 border">foo</button>
        <button className="rounded p-2 border">bar</button>
      </ModalFooter>
    </CenteredModalContainer>
  );
};

registerModal<MODAL_NAME>(MODAL_NAME, ConfirmModal);
