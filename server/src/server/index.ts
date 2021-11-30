import bodyParser from "body-parser";
import express from "express";
import makeRequestContextMiddleware from "./request-context.middleware";
import requestController from "../request/request.controller";
import bodyParserXml from "body-parser-xml";
bodyParserXml(bodyParser);

type Config = {};

export default function makeServer(config: Config) {
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.xml());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(makeRequestContextMiddleware());

  app.use("/", requestController);

  return app;
}
