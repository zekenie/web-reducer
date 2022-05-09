import { config } from "dotenv";
import { join } from "path";
import express from "express";
import compression from "compression";
import morgan from "morgan";
import { createRequestHandler } from "@remix-run/express";
import type { Credentials } from "./auth";
import { cookieParserMiddleware } from "./auth";
import credentialExchange from "./auth";
import attachWebsocketToServer from "./authenticated-sockets";

config({ path: "../.env" });

declare global {
  namespace Express {
    export interface Request {
      creds: Credentials;
    }
    export interface Response {
      setCreds: (creds: Credentials) => void;
    }
  }
}

const BUILD_DIR = join(__dirname, "..", "..", "build");

const app = express();
app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable("x-powered-by");

app.use(cookieParserMiddleware);

// Remix fingerprints its assets so we can cache forever.
app.use(
  "/build",
  express.static("../public/build", { immutable: true, maxAge: "1y" })
);

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static("../public", { maxAge: "1h" }));

app.use(morgan("tiny"));

app.use(async (req, res, next) => {
  res.setCreds = (creds: Credentials) => {
    res.cookie("credentials", JSON.stringify(creds), {
      signed: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
  };
  try {
    const credsString = req.signedCookies?.credentials;
    const creds = credsString ? JSON.parse(credsString) : {};
    const newCreds = await credentialExchange({ creds });
    // @todo make secure, configure
    res.setCreds(newCreds);
    req.creds = newCreds;
    next();
  } catch (e) {
    next(e);
  }
});

app.all(
  "*",
  process.env.NODE_ENV === "development"
    ? (req, res, next) => {
        purgeRequireCache();

        return createRequestHandler({
          build: require(BUILD_DIR),
          mode: process.env.NODE_ENV,
          getLoadContext(req) {
            return { creds: req.creds, setCreds: res.setCreds };
          },
        })(req, res, next);
      }
    : createRequestHandler({
        build: require(BUILD_DIR),
        mode: process.env.NODE_ENV,
        getLoadContext(req, res) {
          return { creds: req.creds, setCreds: res.setCreds };
        },
      })
);
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});

attachWebsocketToServer(server);

function purgeRequireCache() {
  // purge require cache on requests for "server side HMR" this won't let
  // you have in-memory objects between requests in development,
  // alternatively you can set up nodemon/pm2-dev to restart the server on
  // file changes, but then you'll have to reconnect to databases/etc on each
  // change. We prefer the DX of this, so we've included it for you by default
  for (let key in require.cache) {
    if (key.startsWith(BUILD_DIR)) {
      delete require.cache[key];
    }
  }
}
