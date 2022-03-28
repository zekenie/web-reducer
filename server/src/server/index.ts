import bodyParser from "body-parser";
import bodyParserXml from "body-parser-xml";
import express from "express";
import morgan from "morgan";
import authController from "../auth/auth.controller";
import { heartbeat } from "../db/heartbeat";
import hookController from "../hook/hook.controller";
import { connection as redisConnection } from "../redis";
import requestController from "../request/request.controller";
import stateController from "../state/state.controller";
import workerController from "../worker/worker.controller";
import makeRequestContextMiddleware from "./request-context.middleware";
import { duration, forStatusCode, requests } from "./server.metrics";

bodyParserXml(bodyParser);

type Config = {};

export default function makeServer(config: Config) {
  const app = express();

  app.use(morgan("dev"));

  app.get("/heartbeat", async (req, res) => {
    await Promise.all([heartbeat(), redisConnection.ping()]);
    res.json({ ok: true });
  });

  app.use((req, res, next) => {
    const start = Date.now();
    requests.add(1);
    res.on("finish", () => {
      const end = Date.now();
      const reqDuration = end - start;
      duration.record(reqDuration);
      const digit = Math.floor(res.statusCode / 100);
      forStatusCode(`${digit}xx`).add(1);
    });
    next();
  });

  app.use(bodyParser.json());
  app.use(bodyParser.xml());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(makeRequestContextMiddleware());

  app.use("/admin/queues", workerController);

  app.use("/hooks", hookController);
  app.use("/auth", authController);
  app.use("/", requestController);
  app.use("/", stateController);

  return app;
}
