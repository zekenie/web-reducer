import { Router } from "express";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { connection as redisConnection } from "../redis";
import { getStore } from "../server/request-context.middleware";
import * as service from "./request.service";

const limiter = rateLimit({
  store: new RedisStore({
    client: redisConnection.duplicate(),
  }),
  max: 200,
  windowMs: 1000 * 60,
  keyGenerator: (req) => req.params.writeKey,
});

export default Router()
  .get("/:writeKey/settled/:requestId", async (req, res, next) => {
    try {
      await service.resolveWhenJobSettled(
        req.params.requestId,
        req.params.writeKey
      );
      res.json({ jobId: req.params.requestId, settled: true });
    } catch (e) {
      next(e);
    }
  })
  .post("/:writeKey", limiter, async function handleRequest(req, res, next) {
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
