import bodyParser from "body-parser";
import express from "express";
import vmController from "../vm/vm.controller";

type Config = {};

export default function makeServer(config: Config) {
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(vmController);

  app.get("/heartbeat", (req, res) => {
    res.json({ ok: true });
  });

  return app;
}
