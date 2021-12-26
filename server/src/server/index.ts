import bodyParser from "body-parser";
import express from "express";
import makeRequestContextMiddleware from "./request-context.middleware";
import requestController from "../request/request.controller";
import hookController from "../hook/hook.controller";
import bodyParserXml from "body-parser-xml";
import workerController from "../worker/worker.controller";
import { heartbeat } from "../db/heartbeat";
import { connection as redisConnection } from "../redis";
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

  return app;
}
