/**
 * - If not logged in, guest creds are created
 * - If you have creds, and you have a valid jwt, it is used
 * - if you have an expired jwt, the refresh token is used
 * - if your refresh token fails, create a guest user
 */

const { fetch } = require("@remix-run/node");
const jwtLib = require("jsonwebtoken");

async function getNewCredsWithRefreshToken(token, existingExpiredJwt) {
  const res = await fetch(`${process.env.BACKEND_URL}/auth/refresh-token`, {
    method: "POST",
    headers: {
      Accepts: "application/json",
      "Content-Type": "application/json",
      Authorization: existingExpiredJwt,
    },
    body: JSON.stringify({ token }),
  });

  return res.json();
}

async function createGuestUser() {
  const res = await fetch(`${process.env.BACKEND_URL}/auth/guest-user`, {
    method: "POST",
    headers: {
      Accepts: "application/json",
      "Content-Type": "application/json",
    },
  });

  return res.json();
}

function credentialStrategy(creds) {
  // they are logged in and loading the page for the first time
  if (creds.refreshToken && !creds.jwt) {
    return "refresh";
  }
  if (creds.refreshToken && creds.jwt) {
    return "same";
  }
  return "guest";
}

async function credentialExchange({ creds }) {
  const strategy = credentialStrategy(creds);
  try {
    switch (strategy) {
      case "refresh":
        if (!creds.refreshToken) {
          throw new Error("refresh strategy requires refresh token");
        }
        return getNewCredsWithRefreshToken(creds.refreshToken, creds.jwt);
      case "same":
        if (!creds.jwt || !creds.refreshToken) {
          throw new Error("same strategy requires jwt");
        }
        try {
          jwtLib.verify(creds.jwt, process.env.JWT_SECRET, {
            complete: true,
          });
          return { jwt: creds.jwt, refreshToken: creds.refreshToken };
        } catch (e) {
          return getNewCredsWithRefreshToken(creds.refreshToken, creds.jwt);
        }
      case "guest":
        return createGuestUser();
    }
  } catch (e) {
    return createGuestUser();
  }
  throw new Error("unsupported strategy");
}

module.exports = { credentialStrategy, credentialExchange };
