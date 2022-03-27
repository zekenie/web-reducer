import { Request, Response, NextFunction } from "express";
import { validateAndDecodeJwt } from "./auth.service";
import { getStore } from "../server/request-context.middleware";
import httpErrors from "http-errors";

export function makeAuthMiddleware() {
  return async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.headers.authorization) {
        throw new httpErrors.Forbidden("No authorization header");
      }
      const { userId } = validateAndDecodeJwt(req.headers.authorization);
      const requestStore = getStore();
      requestStore.setUser({ id: userId });
      return next();
    } catch (e) {
      next(e);
    }
  };
}
