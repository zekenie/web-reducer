import { Router } from "express";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { connection as redisConnection } from "../redis";
import { getStore } from "../server/request-context.middleware";
import { writeKeyCounter } from "./request.metrics";
import * as service from "./request.service";
import cors from "cors";

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
  .use(cors({ origin: "*", credentials: true }))
  .post("/:writeKey", limiter, async function handleRequest(req, res, next) {
    try {
      writeKeyCounter.add(1);
      const originalUrl = `${req.protocol}://${req.hostname}${req.originalUrl}`;
      const urlObj = new URL(originalUrl);
      console.log({
        request: {
          queryString: urlObj.search,
          body: req.body,
          headers: req.headers,
          id: getStore().id,
          createdAt: new Date().toString(),
        },
        writeKey: req.params.writeKey,
        contentType: req.headers["content-type"]!,
      });
      const responseFromRunner = await service.handleRequest({
        request: {
          queryString: urlObj.search,
          body: req.body,
          headers: req.headers,
          id: getStore().id,
          createdAt: new Date().toString(),
        },
        writeKey: req.params.writeKey,
        contentType: req.headers["content-type"]!,
      });
      if (responseFromRunner?.headers) {
        for (const headerKey of Object.keys(responseFromRunner.headers)) {
          res.header(headerKey, responseFromRunner.headers[headerKey]);
        }
      }
      res.status(responseFromRunner?.statusCode || 202);
      res.json(responseFromRunner?.body || {});
    } catch (e) {
      next(e);
    }
  });
