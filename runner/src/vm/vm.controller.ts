import validate from "../middleware/validate.middleware";
import { Router } from "express";
import * as service from "./vm.service";
import VMInput from "./inputs/vm.input";

export default Router().post(
  "/",
  validate(VMInput),
  async function updateHook(req, res, next) {
    try {
      service.runCode(req.body);
      res.json({});
    } catch (e) {
      next(e);
    }
  }
);
