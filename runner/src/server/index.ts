import bodyParser from "body-parser";
import express, { NextFunction, Request, Response } from "express";
import vmController from "../vm/vm.controller";
import morgan from "morgan";

type Config = {
  onError?: (err: unknown | Error) => void;
};

export default function makeServer(config: Config) {
  const app = express();
  app.use(morgan("dev"));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(vmController);

  app.get("/heartbeat", (req, res) => {
    res.json({ ok: true });
  });

  app.use(function errorHandler(
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (err) {
      if (config.onError) {
        config.onError(err);
      }
      next(err);
      return;
    }
    next();
  });

  return app;
}
