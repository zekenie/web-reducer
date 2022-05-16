import bodyParser from "body-parser";
import express, { NextFunction, Request, Response } from "express";
import vmController from "../vm/vm.controller";
import morgan from "morgan";
import helmet from "helmet";

type Config = {
  onError?: (err: unknown | Error) => void;
};

export default function makeServer(config: Config) {
  const app = express();
  app.use(helmet());
  app.use(morgan("dev"));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(vmController);

  app.get("/heartbeat", (req, res) => {
    res.json({ ok: true });
  });

  app.use(function errorHandler(
    err: Error & { status?: number },
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (config.onError) {
      config.onError(err);
    }
    res.status(err.status || 500);
    res.json({ message: err.message, name: err.name });
    return;
  });

  return app;
}
