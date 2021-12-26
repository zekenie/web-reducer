import { Router } from "express";
import * as service from "./request.service";
import { getStore } from "../server/request-context.middleware";

export default Router()
  .get("/settled/:requestId", async (req, res, next) => {
    try {
      console.log("going to wait for settled", req.params.requestId);
      await service.resolveWhenJobSettled(req.params.requestId);
      res.json({ jobId: req.params.requestId, settled: true });
    } catch (e) {
      next(e);
    }
  })
  .post("/:writeKey", async function handleRequest(req, res, next) {
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
      res.json({ id: getStore().id });
    } catch (e) {
      next(e);
    }
  });
