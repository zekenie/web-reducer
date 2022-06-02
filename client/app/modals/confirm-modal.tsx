import {
  CenteredModalContainer,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "./lib/content";
import { Button } from "flowbite-react";
import { registerModal, useModals } from "./lib/modal-provider";

export type MODAL_NAME = "confirm";
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const MODAL_NAME: MODAL_NAME = "confirm";

declare global {
  namespace Modal {
    interface ModalTypes {
      [MODAL_NAME]: {
        name: MODAL_NAME;
        props: Props;
        resolveValue: boolean;
      };
    }
  }
}

type Props = {
  title: string;
  body: string;
  confirmText?: string;
  cancelText?: string;
};

const TestModal = ({
  title,
  body,
  confirmText = "ok",
  cancelText = "cancel",
}: Props) => {
  const { closeModal } = useModals();
  return (
    <CenteredModalContainer>
      <ModalHeader title={title} />
      <ModalBody>{body}</ModalBody>
      <ModalFooter>
        <Button size="sm" color="red" onClick={() => closeModal(false)}>
          {cancelText}
        </Button>
        <Button
          size="sm"
          color="green"
          autoFocus
          onClick={() => closeModal(true)}
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </CenteredModalContainer>
  );
};

export function register() {
  registerModal<MODAL_NAME>(MODAL_NAME, TestModal);
}
