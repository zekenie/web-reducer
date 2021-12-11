import bodyParser from "body-parser";
import express from "express";

type Config = {};

export default function makeServer(config: Config) {
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  return app;
}
