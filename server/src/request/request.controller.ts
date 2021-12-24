import { Router } from "express";
import * as service from "./request.service";
import { getStore } from "../server/request-context.middleware";

export default Router().post(
  "/:writeKey",
  async function handleRequest(req, res, next) {
    try {
      await service.handleRequest({
        request: {
          body: req.body,
          headers: req.headers,
          id: getStore().id,
        },
        writeKey: req.params.writeKey,
        contentType: req.headers["content-type"]!,
      });
      res.status(202);
      res.json({});
    } catch (e) {
      next(e);
    }
  }
);
