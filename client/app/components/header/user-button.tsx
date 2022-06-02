import { LoginIcon } from "@heroicons/react/outline";
import { Form } from "@remix-run/react";
import { useState } from "react";
import type { UserDetails } from "~/remote/auth-client.server";

export default function UserButton({
  userDetails,
}: {
  userDetails: UserDetails;
}) {
  switch (userDetails.workflowState) {
    case "guest":
      return <SigninButton />;
    case "user":
      return <div>{userDetails.email}</div>;
  }
}

function SigninButton() {
  const [isEmailShowing, setIsEmailShowing] = useState(false);
  return (
    <Form
      method="post"
      className="flex flex-row space-x-2"
      action="/auth/signin"
    >
      {isEmailShowing && (
        <input autoFocus name="email" type="email" placeholder="email" />
      )}
      <button
        type={isEmailShowing ? "submit" : "button"}
        // onClick={(!isEmailShowing) && () => {}}
        onClick={
          isEmailShowing
            ? undefined
            : (e) => {
                e.preventDefault();
                setIsEmailShowing(true);
              }
        }
        className="flex flex-row space-x-1 items-center"
      >
        <LoginIcon className="w-5 h-5" />
        <span>Sign in/up</span>
      </button>
    </Form>
  );
}
