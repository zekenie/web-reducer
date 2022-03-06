import { Request, Response, NextFunction } from "express";
// import { validateAndDecodeJwt } from "./auth.service";
// import { getStore } from "../server/request-context.middleware";
// import httpErrors from "http-errors";

export function makeAuthMiddleware() {
  return async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    next();
    // try {
    //   if (!req.headers.authorization) {
    //     throw new httpErrors.Forbidden("No authorization header");
    //   }
    //   const { isValid, userId } = await validateAndDecodeJwt(
    //     req.headers.authorization
    //   );
    //   if (isValid) {
    //     const requestStore = getStore();
    //     requestStore.setUserId(userId);
    //     return next();
    //   }
    // } catch (e) {
    //   next(e);
    // }
  };
}
