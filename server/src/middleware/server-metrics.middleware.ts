// this file came from here: https://raw.githubusercontent.com/ISNIT0/express-class-validator/master/lib/index.ts

import { Request, Response, NextFunction } from "express";
import { duration, forStatusCode, requests } from "../server/server.metrics";

const isProd = process.env.NODE_ENV === "production";

export default function serverMetricsMiddlewareFactory() {
  return function serverMetricsMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
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
  };
}
