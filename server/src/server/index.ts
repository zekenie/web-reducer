import bodyParser from "body-parser";
import bodyParserXml from "body-parser-xml";
import express from "express";
import { heartbeat } from "../db/heartbeat";
import hookController from "../hook/hook.controller";
import { connection as redisConnection } from "../redis";
import requestController from "../request/request.controller";
import stateController from "../state/state.controller";
import workerController from "../worker/worker.controller";
import makeRequestContextMiddleware from "./request-context.middleware";

bodyParserXml(bodyParser);

type Config = {};

export default function makeServer(config: Config) {
  const app = express();

  app.use(bodyParser.json());
  app.use(bodyParser.xml());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(makeRequestContextMiddleware());

  app.use("/admin/queues", workerController);

  app.get("/heartbeat", async (req, res) => {
    await Promise.all([heartbeat(), redisConnection.ping()]);
    res.json({ ok: true });
  });

  app.use("/hooks", hookController);
  app.use("/", requestController);
  app.use("/", stateController);

  return app;
}
