import { LoginIcon } from "@heroicons/react/outline";
import { Form } from "@remix-run/react";
import { useState } from "react";
import type { UserDetails } from "~/remote/auth-client.server";
import { Dropdown, Button, TextInput, Card } from "flowbite-react";
import { Link, useNavigate } from "react-router-dom";

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
          {/* <Dropdown.Item>Settings</Dropdown.Item> */}
          {/* <Dropdown.Item>Learn</Dropdown.Item> */}
          {/* <Dropdown.Item>Feedback</Dropdown.Item> */}
          <Dropdown.Item onClick={() => navigate("/legal")}>
            Legal
          </Dropdown.Item>
          {/* <Dropdown.Divider /> */}
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
      className={`relative z-50 flex flex-row space-x-2 transform duration-300 ${
        isEmailShowing ? "" : ""
      }`}
      action="/auth/signin"
    >
      {isEmailShowing && (
        <div className="absolute w-full pt-3 bottom-0 transform translate-y-full">
          <div className="rounded-lg shadow border p-4 bg-white prose">
            <h3>Unauthenticated endpoints are ephemeral</h3>
            <p>
              In order to keep your code and data, sign up. This is mainly to
              fight abuse. I promise to never spam you. This product is fully
              free for now. At some point soon there will be paid plans, but
              there will always be a generous free tier.
            </p>

            <p>
              You should read our <Link to="/legal">Terms of Service</Link>.
              This project is{" "}
              <a target="_blank" href="https://github.com/zekenie/web-reducer">
                open source
              </a>
              .
            </p>
          </div>
        </div>
      )}

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
