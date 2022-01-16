import { Request, Response, NextFunction } from "express";
import { getUserIdByAuthNId, validateAndDecodeJwt } from "./auth.service";
import { getStore } from "../server/request-context.middleware";

export function makeAuthMiddleware() {
  return async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { isValid, payload } = await validateAndDecodeJwt<{ sub: string }>(
        req.headers.authorization!
      );
      if (isValid) {
        const userId = await getUserIdByAuthNId(payload.sub);
        const requestStore = getStore();
        requestStore.setUserId(userId);
        return next();
      }
    } catch (e) {
      next(e);
    }
  };
}
