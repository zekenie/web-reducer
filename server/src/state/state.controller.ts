import { Router } from "express";
import * as service from "./state.service";

export default Router().get(
  "/:readKey",
  async function handleRequest(req, res, next) {
    try {
      const stateRecord = await service.readState(req.params.readKey);
      if (stateRecord) {
        res.status(200);
        res.json(stateRecord.state);
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
