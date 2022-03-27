import { Router } from "express";
import validate from "../middleware/validate.middleware";
import * as service from "./hook.service";
import UpdateHook from "./inputs/update-hook.input";
import * as stateService from "../state/state.service";
import { last } from "lodash";
import { makeAccessMiddleware } from "../access/access.middleware";
import { getStore } from "../server/request-context.middleware";
import { makeAuthMiddleware } from "../auth/auth.middleware";

export default Router()
  .use(makeAuthMiddleware())
  .post("/", async (req, res, next) => {
    try {
      const { userId } = getStore();
      const { hookId, writeKey, readKey } = await service.createHook({
        userId,
      });
      res.status(201).json({ hookId, writeKey, readKey });
    } catch (e) {
      next(e);
    }
  })
  // .use(
  // "/:id"
  //makeAccessMiddleware((req) => req.params.id)
  // )
  .get("/:id", async function (req, res, next) {
    try {
      const { draft, published } = await service.readHook(req.params.id);
      res.json({ draft, published });
    } catch (e) {
      next(e);
    }
  })
  .get("/:id/history", async (req, res, next) => {
    try {
      const stateHistoryPage = await stateService.readStateHistory(
        req.params.id,
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
  .put("/:id", validate(UpdateHook), async function updateHook(req, res, next) {
    try {
      await service.updateDraft(req.params.id, req.body);
      res.json({});
    } catch (e) {
      next(e);
    }
  });
