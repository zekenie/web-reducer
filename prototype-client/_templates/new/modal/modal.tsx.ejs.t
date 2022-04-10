---
to: <%= absPath %>
---
import { registerModal } from "../modals/ModalProvider";
import {
  CenteredModalContainer,
  ModalBody,
  ModalHeader,
  ModalFooter
} from "../modals/Content";

export type MODAL_NAME = "<%= h.changeCase.param(modalName) %>";
export const MODAL_NAME: MODAL_NAME = "<%= h.changeCase.param(modalName) %>";

declare global {
  namespace Modal {
    interface ModalTypes {
      [MODAL_NAME]: {
        name: MODAL_NAME;
        props: Props;
        resolveValue: unknown;
      };
    }
  }
}

type Props = {};

const <%= h.changeCase.pascal(name) %> = ({}: Props) => {
  return (
    <CenteredModalContainer>
      <ModalHeader title="title goes here" />
      <ModalBody>body goes here</ModalBody>
      <ModalFooter>Footer goes here</ModalFooter>
    </CenteredModalContainer>
  );
};

registerModal<MODAL_NAME>(MODAL_NAME, <%= h.changeCase.pascal(name) %>);
