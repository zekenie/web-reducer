import styles from "./styles/app.css";
import type { MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import ModalProvider from "./modals/lib/modal-provider";
import { json } from "@remix-run/node";
import { Toaster } from "react-hot-toast";

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "New Remix App",
  viewport: "width=device-width,initial-scale=1",
});

export async function loader() {
  return json({
    ENV: {
      AUTHENTICATED_SOCKET_URL: process.env.AUTHENTICATED_SOCKET_URL,
      SITE_URL: process.env.SITE_URL,
    },
  });
}

export default function App() {
  const data = useLoaderData();

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <ModalProvider>
          <div className="flex flex-col h-screen overflow-hidden">
            <Outlet />
          </div>
          <Toaster position="bottom-right" />
        </ModalProvider>
        <ScrollRestoration />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
          }}
        />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function links() {
  return [{ rel: "stylesheet", href: styles }];
}
