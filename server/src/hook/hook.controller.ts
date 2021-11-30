import { Router } from "express";
import validate from "../middleware/validate.middleware";
import * as service from "./hook.service";
import UpdateHook from "./inputs/update-hook.input";

export default Router().put(
  "/:id",
  validate(UpdateHook),
  async function updateHook(req, res, next) {
    try {
      await service.updateHook(req.body);
      res.json({});
    } catch (e) {
      next(e);
    }
  }
);
