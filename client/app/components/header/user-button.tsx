import { LoginIcon } from "@heroicons/react/outline";
import { Form } from "@remix-run/react";
import { useState } from "react";
import type { UserDetails } from "~/remote/auth-client.server";
import { Dropdown, Button, TextInput } from "flowbite-react";
import { useNavigate } from "react-router-dom";

export default function UserButton({
  userDetails,
}: {
  userDetails: UserDetails;
}) {
  const navigate = useNavigate();
  switch (userDetails.workflowState) {
    case "guest":
      return <SigninButton />;
    case "user":
      return (
        <Dropdown
          arrowIcon
          className="z-50"
          color="light"
          label={userDetails.email}
        >
          <Dropdown.Item>Settings</Dropdown.Item>
          <Dropdown.Item>Learn</Dropdown.Item>
          <Dropdown.Item>Feedback</Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item onClick={() => navigate("/auth/logout")}>
            Sign out
          </Dropdown.Item>
        </Dropdown>
      );
  }
}

function SigninButton() {
  const [isEmailShowing, setIsEmailShowing] = useState(false);
  return (
    <Form
      method="post"
      className={`flex flex-row space-x-2 transform duration-300 ${
        isEmailShowing ? "translate-x-32" : ""
      }`}
      action="/auth/signin"
    >
      {isEmailShowing && (
        <TextInput
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsEmailShowing(false);
            }
          }}
          autoFocus
          name="email"
          type="email"
          placeholder="Email"
        />
      )}
      <Button
        className="bg-green-600 hover:bg-green-700"
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
      >
        <span>Authenticate To Save</span>
        <LoginIcon className="w-5 h-5 ml-1" />
      </Button>
    </Form>
  );
}
