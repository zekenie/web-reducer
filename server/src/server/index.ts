import bodyParser from "body-parser";
import bodyParserXml from "body-parser-xml";
import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import authController from "../auth/auth.controller";
import { heartbeat } from "../db/heartbeat";
import hookController from "../hook/hook.controller";
import serverMetricsMiddlewareFactory from "../middleware/server-metrics.middleware";
import { connection as redisConnection } from "../redis";
import requestController from "../request/request.controller";
import stateController from "../state/state.controller";
import secretController from "../secret/secret.controller";
import workerController from "../worker/worker.controller";
import makeRequestContextMiddleware from "./request-context.middleware";
import testInternalsController from "../test-internals/test-internals.controller";
import helmet from "helmet";

bodyParserXml(bodyParser);

type Config = {};

export default function makeServer(config: Config) {
  const app = express();

  app.use(helmet());

  app.use(morgan("dev"));

  app.get("/heartbeat", async (req, res) => {
    await Promise.all([heartbeat(), redisConnection.ping()]);
    res.json({ ok: true });
  });

  app.use(serverMetricsMiddlewareFactory());

  app.use(bodyParser.json());
  app.use(bodyParser.text());
  app.use(bodyParser.xml());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(makeRequestContextMiddleware());

  app.use(
    "/admin/queues",
    (req, res, next) => {
      // https://github.com/felixmosh/bull-board/issues/311
      // because otherwise forces assets to serve https
      res.setHeader("Content-Security-Policy", "");
      next();
    },
    workerController
  );
  app.use("/test-internals", testInternalsController);

  app.use("/hooks", hookController);
  app.use("/auth", authController);
  app.use("/secrets", secretController);
  app.use("/write", requestController);
  app.use("/read", stateController);

  app.use(
    (
      err: Error & { status?: number },
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      console.error(err);
      res.status(err.status || 500);
      res.json({ message: err.message, name: err.name });
    }
  );

  return app;
}
