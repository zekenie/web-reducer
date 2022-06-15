import { InformationCircleIcon } from "@heroicons/react/outline";
import { Alert } from "flowbite-react";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { Fragment } from "react";

type Props = {
  heading: string | ReactNode;
  description: string | ReactNode;
  id: string;
};

export default function InfoPanel({ id, heading, description }: Props) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const hide = window.localStorage.getItem(`hide-info-panel:${id}`);
    if (!hide) {
      setVisible(true);
    }
  }, [id]);
  const onDismiss = useCallback(() => {
    window.localStorage.setItem(`hide-info-panel:${id}`, "true");
    setVisible(false);
  }, [id]);
  if (!visible) {
    return null;
  }
  return (
    <Alert
      rounded={false}
      color="blue"
      onDismiss={onDismiss}
      additionalContent={
        <Fragment>
          <div className="mt-2 mb-4 text-sm text-blue-700 ">{description}</div>
        </Fragment>
      }
      icon={InformationCircleIcon}
    >
      <h3 className="text-lg font-medium text-blue-700 ">{heading}</h3>
    </Alert>
  );
}
