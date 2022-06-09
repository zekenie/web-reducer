/* eslint-disable import/first */
require("dotenv").config({ path: "../.env" });

import { join } from "path";
import express from "express";
import compression from "compression";
import morgan from "morgan";
import { createRequestHandler } from "@remix-run/express";
import type { Credentials } from "./auth";
import { cookieParserMiddleware } from "./auth";
import credentialExchange from "./auth";
import {
  redisConnection,
  attach as attachAuthenticatedSocket,
} from "./authenticated-sockets";
import { attach as attachUnauthenticatedSocket } from "./unauthenticated-sockets";
import helmet from "helmet";
import { WebSocketServer } from "ws";
import type { WebSocket } from "ws";
import { readKeyHandler } from "./read-key";
import { writeKeyHandler } from "./write-key";

declare global {
  namespace Express {
    export interface Request {
      creds: Credentials;
    }
    export interface Response {
      setCreds: (creds: Credentials) => void;
      logout: () => void;
    }
  }
}

const BUILD_DIR = join(__dirname, "..", "..", "build");

const app = express();
app.use(compression());

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(cookieParserMiddleware);

// Remix fingerprints its assets so we can cache forever.
app.use(
  "/build",
  express.static("../public/build", { immutable: true, maxAge: "1y" })
);

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static("../public", { maxAge: "1h" }));
app.use(
  "/object-visualizer",
  express.static(
    join(__dirname, "..", "/node_modules/object-visualizer/dist"),
    { maxAge: "1y" }
  )
);
app.get("/heartbeat", (req, res) => res.json({ ok: true }));
app.use(morgan("tiny"));

app.get("/read/:readKey", readKeyHandler);
app.use("/write", writeKeyHandler);

app.use((req, res, next) => {
  res.setCreds = (creds: Credentials) => {
    res.cookie("credentials", JSON.stringify(creds), {
      signed: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });

    res.logout = () => {
      res.clearCookie("credentials");
    };
  };
  next();
});

app.use(async (req, res, next) => {
  try {
    const credsString = req.signedCookies?.credentials;
    const creds = credsString ? JSON.parse(credsString) : {};
    const newCreds = await credentialExchange({ creds });
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
            return {
              creds: req.creds,
              setCreds: res.setCreds,
              logout: res.logout,
            };
          },
        })(req, res, next);
      }
    : createRequestHandler({
        build: require(BUILD_DIR),
        mode: process.env.NODE_ENV,
        getLoadContext(req, res) {
          return {
            creds: req.creds,
            setCreds: res.setCreds,
            logout: res.logout,
          };
        },
      })
);
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});

const wss = new WebSocketServer({ noServer: true });

wss.on("error", (e) => console.error("socket error", e));

server.on("upgrade", async function upgrade(request, socket, head) {
  const url = new URL(request.url!, `http://${request.headers.host}`);
  const rejectConnection = (status = 401) => {
    socket.write(`HTTP/1.1 ${status} Unauthorized\r\n\r\n`);
    socket.destroy();
  };
  const connect = (onConnect: (ws: WebSocket) => void) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      ws.on("error", (e) => console.error("ws socket error", e));
      wss.emit("connection", ws, request);
      onConnect(ws);
    });
  };
  switch (url.pathname) {
    case "/hook-events":
      await attachAuthenticatedSocket({
        rejectConnection,
        request,
        url,
        connect,
      });
      break;
    case "/state-events":
      await attachUnauthenticatedSocket({ rejectConnection, url, connect });
      break;
    default:
      rejectConnection(404);
  }
});

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

function closeGracefully(signal: string) {
  try {
    console.log(`*^!@4=> Received signal to terminate: ${signal}`);

    server.close(async () => {
      try {
        await redisConnection.quit();
      } catch (e) {
        return process.exit(1);
      }
      process.exit();
    });
  } catch (e) {
    console.error("error responding to ", signal);
    process.exit(1);
  }
}
process.on("SIGINT", closeGracefully);
process.on("SIGTERM", closeGracefully);
