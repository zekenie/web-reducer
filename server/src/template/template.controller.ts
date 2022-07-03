import { Router } from "express";
import * as service from "./template.service";

export default Router({ mergeParams: true }).get(
  "/",
  async function handleRequest(req, res, next) {
    try {
      // @ts-expect-error
      const hookId = req.params.hookId as string;
      const templates = await service.getTemplates({ hookId });
      res.json({ templates });
    } catch (e) {
      next(e);
    }
  }
);
