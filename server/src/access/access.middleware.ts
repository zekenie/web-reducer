import { NextFunction, Request, Response } from "express";
import { getStore } from "../server/request-context.middleware";
import { hasAccess } from "./access.service";
import httpErrors from "http-errors";

export function makeAccessMiddleware(hookIdResolver: (req: Request) => string) {
  return async function accessMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const hookId = hookIdResolver(req);
      const { userId } = getStore();
      if (await hasAccess({ hookId, userId })) {
        console.log(userId, "has access to ", hookId);
        return next();
      }
      throw new httpErrors.Forbidden(
        `${userId} does not have access to ${hookId}`
      );
    } catch (e) {
      next(e);
    }
    next();
  };
}
