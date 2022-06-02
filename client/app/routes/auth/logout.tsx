import type { LoaderFunction } from "@remix-run/server-runtime";

export const loader: LoaderFunction = ({ context }) => {
  context.logout();
  return null;
};

export default function Logout() {
  return <div>You have been logged out. Goodbye.</div>;
}
