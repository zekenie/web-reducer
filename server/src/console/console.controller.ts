import { Router } from "express";
import * as service from "./console.service";

export default Router({ mergeParams: true }).get(
  "/",
  async function handleRequest(req, res, next) {
    try {
      // @ts-expect-error
      const hookId = req.params.hookId as string;
      const consolePage = await service.getConsolePageForHook({
        hookId,
        paginationArgs: {
          token: req.query.token as string | undefined,
          pageSize: 40,
        },
      });
      res.json({ console: consolePage });
    } catch (e) {
      next(e);
    }
  }
);
