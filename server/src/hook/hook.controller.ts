import { Router } from "express";
import validate from "../middleware/validate.middleware";
import * as service from "./hook.service";
import UpdateHook from "./inputs/update-hook.input";
import * as stateService from "../state/state.service";

export default Router()
  .post("/", async (req, res, next) => {
    try {
      const { hookId, writeKey, readKey } = await service.createHook();
      res.status(201).json({ hookId, writeKey, readKey });
    } catch (e) {
      next(e);
    }
  })
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
          afterColumn: "createdAt",
          after: (req.query.after as string) || new Date().toISOString(),
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
