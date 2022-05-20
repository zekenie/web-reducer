// this file came from here: https://raw.githubusercontent.com/ISNIT0/express-class-validator/master/lib/index.ts

import { transformAndValidate } from "class-transformer-validator";
import { Request, Response, NextFunction } from "express";

const isProd = process.env.NODE_ENV === "production";

export default function validate<T>(
  c: T,
  whitelist = true,
  errorHandler?: (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
  ) => void
) {
  return function ExpressClassValidate(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const toValidate = req.body;
    if (!toValidate) {
      if (errorHandler) {
        errorHandler({ type: "no-body" }, req, res, next);
      } else {
        res.status(400).json({
          error: true,
          message: "Validation failed",
          ...(isProd
            ? {}
            : { originalError: { message: "No request body found" } }),
        });
      }
    } else {
      transformAndValidate(c as any, toValidate, { validator: { whitelist } })
        .then((transformed) => {
          req.body = transformed;
          next();
        })
        .catch((err) => {
          if (errorHandler) {
            errorHandler(err, req, res, next);
          } else {
            res.status(400).json({
              error: true,
              message: "Validation failed",
              ...(isProd ? {} : { originalError: err }),
            });
          }
        });
    }
  };
}
