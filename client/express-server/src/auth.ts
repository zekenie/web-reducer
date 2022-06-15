/**
 * - If not logged in, guest creds are created
 * - If you have creds, and you have a valid jwt, it is used
 * - if you have an expired jwt, the refresh token is used
 * - if your refresh token fails, create a guest user
 */

import { fetch } from "@remix-run/node";
import cookieParser from "cookie-parser";
import * as jwtLib from "jsonwebtoken";
import {
  awaitNewCredsOnRefreshToken,
  publishNewCreds,
} from "./refresh-token-state";

export type Credentials = {
  jwt: string;
  refreshToken: string;
};

export const cookieParserMiddleware = cookieParser(process.env.COOKIE_SECRET);

export async function getNewCredsWithRefreshToken(
  existingCreds: Credentials
): Promise<Credentials> {
  const promiseForNewCreds = awaitNewCredsOnRefreshToken(
    existingCreds.refreshToken
  );
  try {
    const res = await fetch(`${process.env.BACKEND_URL}/auth/refresh-token`, {
      method: "POST",
      headers: {
        Accepts: "application/json",
        "Content-Type": "application/json",
        authorization: existingCreds.jwt,
      },
      body: JSON.stringify({ token: existingCreds.refreshToken }),
    });

    console.log("response code", res.status, "from refresh request");
    const json: Credentials = await res.json();
    await publishNewCreds(existingCreds.refreshToken, json);
    return json;
  } catch (e) {
    const newCredsFromOtherReq = await promiseForNewCreds;
    if (newCredsFromOtherReq) {
      return newCredsFromOtherReq;
    }
    console.error("original error", e);
    throw new Error("error refetching and no other req resolved");
  }
}

async function createGuestUser() {
  const res = await fetch(`${process.env.BACKEND_URL}/auth/guest-user`, {
    method: "POST",
    headers: {
      Accepts: "application/json",
      "Content-Type": "application/json",
    },
  });

  return res.json() as Promise<Credentials>;
}

function credentialStrategy(creds: Credentials) {
  // they are logged in and loading the page for the first time
  if (creds.refreshToken && !creds.jwt) {
    return "refresh";
  }
  if (creds.refreshToken && creds.jwt) {
    return "same";
  }
  return "guest";
}

export function verifyJwt(jwt: string): boolean {
  try {
    jwtLib.verify(jwt, process.env.JWT_SECRET!, {
      complete: true,
    });
    return true;
  } catch (e) {
    return false;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function credentialExchange({
  creds,
}: {
  creds: Credentials;
}) {
  const strategy = credentialStrategy(creds);
  try {
    switch (strategy) {
      case "refresh":
        if (!creds.refreshToken) {
          throw new Error("refresh strategy requires refresh token");
        }
        // adding a jitter to make sure there's one winner
        await sleep(Math.random() * 50);
        return getNewCredsWithRefreshToken(creds);
      case "same":
        if (!creds.jwt || !creds.refreshToken) {
          throw new Error("same strategy requires jwt");
        }
        if (verifyJwt(creds.jwt)) {
          return { jwt: creds.jwt, refreshToken: creds.refreshToken };
        }
        return getNewCredsWithRefreshToken(creds);
      case "guest":
        return createGuestUser();
    }
  } catch (e) {
    console.warn("credentailExchange error with strategy " + strategy, e);
    return createGuestUser();
  }
  throw new Error("unsupported strategy");
}
