import type { EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import * as jwtLib from "jsonwebtoken";
import { renderToString } from "react-dom/server";
import { credsCookie, parseAuthCookie } from "./auth/creds-cookie.server";
import type { Credentials } from "./remote/auth-client.server";
import type buildClientForJwt from "./remote/index.server";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  let markup = renderToString(
    <RemixServer context={remixContext} url={request.url} />
  );

  responseHeaders.set("Content-Type", "text/html");

  const { creds: oldCreds, client } = await await parseAuthCookie(
    request.headers.get("Cookie")
  );

  const newCreds = await credentialExchange({
    creds: oldCreds,
    client,
  });

  if (
    newCreds.refreshToken !== oldCreds.refreshToken ||
    newCreds.jwt !== oldCreds.jwt
  ) {
    responseHeaders.set("Set-Cookie", await credsCookie.serialize(newCreds));
  }

  return new Response("<!DOCTYPE html>" + markup, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}

/**
 * - If not logged in, guest creds are created
 * - If you have creds, and you have a valid jwt, it is used
 * - if you have an expired jwt, the refresh token is used
 * - if your refresh token fails, create a guest user
 */

function credentialStrategy(
  creds: Partial<Credentials>
): "guest" | "refresh" | "same" {
  // they are logged in and loading the page for the first time
  if (creds.refreshToken && !creds.jwt) {
    return "refresh";
  }
  if (creds.refreshToken && creds.jwt) {
    return "same";
  }
  return "guest";
}

async function credentialExchange({
  creds,
  client,
}: {
  creds: Partial<Credentials>;
  client: ReturnType<typeof buildClientForJwt>;
}): Promise<Credentials> {
  const strategy = credentialStrategy(creds);
  try {
    switch (strategy) {
      case "refresh":
        if (!creds.refreshToken) {
          throw new Error("refresh strategy requires refresh token");
        }
        return client.auth.refresh({
          token: creds.refreshToken,
        });
      case "same":
        if (!creds.jwt || !creds.refreshToken) {
          throw new Error("same strategy requires jwt");
        }
        try {
          jwtLib.verify(creds.jwt, process.env.JWT_SECRET!, {
            complete: true,
          });
          return { jwt: creds.jwt, refreshToken: creds.refreshToken };
        } catch (e) {
          return client.auth.refresh({
            token: creds.refreshToken,
          });
        }
      case "guest":
        return client.auth.createGuestUser();
    }
  } catch (e) {
    return client.auth.createGuestUser();
  }
  throw new Error("unsupported strategy");
}
