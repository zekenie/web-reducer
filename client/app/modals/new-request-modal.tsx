import {
  CenteredModalContainer,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "./lib/content";
import { registerModal, useModals } from "./lib/modal-provider";
import EmptyState from "~/components/hook/requests-table/empty-state";

export type MODAL_NAME = "new-request";
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const MODAL_NAME: MODAL_NAME = "new-request";

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
  siteUrl: string;
  writeKeys: string[];
};

const TestModal = ({ siteUrl, writeKeys }: Props) => {
  const { closeModal } = useModals();
  return (
    <CenteredModalContainer>
      <ModalHeader title="Test request" />
      <ModalBody>
        <EmptyState
          onRequest={closeModal}
          writeKeys={writeKeys}
          siteUrl={siteUrl}
        />
      </ModalBody>
    </CenteredModalContainer>
  );
};

export function register() {
  registerModal<MODAL_NAME>(MODAL_NAME, TestModal);
}
