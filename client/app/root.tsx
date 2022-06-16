import styles from "./styles/app.css";
import type { LoaderFunction, MetaFunction } from "@remix-run/node";
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
import { AppWithNav } from "./components/header";
import buildClientForJwt from "./remote/index.server";
import { UserDetails } from "./remote/auth-client.server";
import syntaxHighlighting from "highlight.js/styles/night-owl.css";

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "WebReducer",
  viewport: "width=device-width,initial-scale=1",
});

export const loader: LoaderFunction = async ({ context }) => {
  const client = buildClientForJwt(context.creds.jwt);
  const me = await client.auth.me();
  return json({
    me,
    ENV: {
      AUTHENTICATED_SOCKET_URL: process.env.AUTHENTICATED_SOCKET_URL,
      SITE_URL: process.env.SITE_URL,
    },
  });
};

export default function App() {
  const data = useLoaderData<{
    me: UserDetails;
    ENV: {
      AUTHENTICATED_SOCKET_URL: string;
      SITE_URL: string;
    };
  }>();

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <ModalProvider>
          <div className="flex flex-col h-screen overflow-hidden">
            <AppWithNav userDetails={data.me}>
              <Outlet context={{ userDetails: data.me }} />
            </AppWithNav>
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
  return [
    { rel: "stylesheet", href: styles },
    { rel: "stylesheet", href: syntaxHighlighting },
  ];
}
