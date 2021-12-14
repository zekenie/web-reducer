import { Router } from "express";
import * as service from "./request.service";
import { getStore } from "../server/request-context.middleware";

export default Router().post(
  "/:writeKey",
  async function handleRequest(req, res, next) {
    try {
      await service.handleRequest({
        body: req.body,
        headers: req.headers,
        writeKey: req.params.writeKey,
        contentType: req.headers["content-type"]!,
        requestId: getStore().id,
      });
      res.status(202);
      res.json({});
    } catch (e) {
      next(e);
    }
  }
);
