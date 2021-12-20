import { Router } from "express";
import * as service from "./state.service";

export default Router().get(
  "/:readKey",
  async function handleRequest(req, res, next) {
    try {
      const state = await service.readState(req.params.readKey);
      if (state) {
        res.status(200);
        res.json(state);
      } else {
        res.status(404);
        res.json({
          message: "not found",
        });
      }
    } catch (e) {
      next(e);
    }
  }
);
