import { Router } from "express";
import { makeAccessMiddleware } from "../access/access.middleware";
import { makeAuthMiddleware } from "../auth/auth.middleware";
import validate from "../middleware/validate.middleware";
import { getStore } from "../server/request-context.middleware";
import * as stateService from "../state/state.service";
import * as service from "./hook.service";
import * as keyService from "../key/key.service";
import UpdateHookInput from "./inputs/update-hook.input";
import CreateKeyInput from "./inputs/create-key.input";
import createHttpError from "http-errors";
import templateController from "../template/template.controller";

export default Router()
  .use(makeAuthMiddleware())
  .get("/", async (req, res, next) => {
    try {
      const { userId } = getStore();
      const hooks = await service.listHooks({ userId });
      res.json(hooks);
    } catch (e) {
      next(e);
    }
  })
  .post("/", async (req, res, next) => {
    try {
      const { userId } = getStore();
      const overview = await service.createHook({
        userId,
      });
      res.status(201).json(overview);
    } catch (e) {
      next(e);
    }
  })
  .use(
    "/:hookId",
    makeAccessMiddleware((req) => req.params.hookId)
  )
  .use("/:hookId/templates", templateController)
  .get("/:hookId", async function (req, res, next) {
    try {
      const hook = await service.readHook(req.params.hookId);
      res.json(hook);
    } catch (e) {
      next(e);
    }
  })
  .get("/:hookId/history", async (req, res, next) => {
    try {
      const stateHistoryPage = await stateService.readStateHistoryPage(
        req.params.hookId,
        {
          token: req.query.token as string,
          pageSize: 40,
        }
      );
      res.json(stateHistoryPage);
    } catch (e) {
      next(e);
    }
  })
  .delete("/:hookId", async function deleteHook(req, res, next) {
    try {
      await service.__dangerouslyDeleteHook({ hookId: req.params.hookId });
      res.status(202).json({ deleted: true });
    } catch (e) {
      next(e);
    }
  })
  .post("/:hookId/publish", async function publishDraft(req, res, next) {
    try {
      await service.publishDraft({ hookId: req.params.hookId });
      res.json({});
    } catch (e) {
      next(e);
    }
  })
  .post("/:hookId/reset-requests", async (req, res, next) => {
    try {
      await service.__dangerouslyDeleteAllRequestsForHook({
        hookId: req.params.hookId,
      });
      res.status(201).json({});
    } catch (e) {
      next();
    }
  })
  .put(
    "/:hookId",
    validate(UpdateHookInput),
    async function updateHook(req, res, next) {
      try {
        const promises = [];
        const body = req.body as UpdateHookInput;

        if (body.code) {
          promises.push(
            service.updateDraft(req.params.hookId, { code: req.body.code })
          );
        }

        if (body.name || body.description) {
          promises.push(
            service.updateDetails(req.params.hookId, {
              name: body.name || null,
              description: body.description || null,
            })
          );
        }

        await Promise.all(promises);
        res.json({});
      } catch (e) {
        next(e);
      }
    }
  )
  .post(
    "/:hookId/keys",
    validate(CreateKeyInput),
    async function createKey(req, res, next) {
      try {
        const key = await keyService.createKey({
          hookId: req.params.hookId,
          type: req.body.type,
        });
        res.status(201).json({ key });
      } catch (e) {
        next(e);
      }
    }
  )
  .get("/:hookId/keys", async function getKeys(req, res, next) {
    try {
      const keyRecords = await keyService.getKeyRecordsForHook({
        hookId: req.params.hookId,
      });
      res.json({ keys: keyRecords });
    } catch (e) {
      next(e);
    }
  })
  .post("/:hookId/keys/:key/pause", async function pauseKey(req, res, next) {
    try {
      const { paused } = await keyService.pauseKey({
        hookId: req.params.hookId,
        key: req.params.key,
      });
      if (paused) {
        res.status(202).json({});
      } else {
        throw createHttpError(404);
      }
    } catch (e) {
      next(e);
    }
  })
  .post("/:hookId/keys/:key/play", async function playKey(req, res, next) {
    try {
      const { played } = await keyService.playKey({
        hookId: req.params.hookId,
        key: req.params.key,
      });
      if (played) {
        res.status(202).json({});
      } else {
        throw createHttpError(404);
      }
    } catch (e) {
      next(e);
    }
  });
