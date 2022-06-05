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
  .post("/:hookId/publish", async function publishDraft(req, res, next) {
    try {
      await service.publishDraft({ hookId: req.params.hookId });
      res.json({});
    } catch (e) {
      next(e);
    }
  })
  .put(
    "/:hookId",
    validate(UpdateHookInput),
    async function updateHook(req, res, next) {
      try {
        await service.updateDraft(req.params.hookId, req.body);
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
  .delete("/:hookId/keys/:key", async function deleteKey(req, res, next) {
    try {
      const { deleted } = await keyService.deleteKey({
        hookId: req.params.hookId,
        key: req.params.key,
      });
      if (deleted) {
        res.status(202).json({});
      } else {
        throw createHttpError(404);
      }
    } catch (e) {
      next(e);
    }
  });
