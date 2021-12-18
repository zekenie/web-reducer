import validate from "../middleware/validate.middleware";
import { Router } from "express";
import * as service from "./vm.service";
import VMInput from "./inputs/vm.input";
import BulkVMInput from "./inputs/bulk-vm.input";

export default Router()
  .post("/", validate(VMInput), async function vmController(req, res, next) {
    const body = req.body as VMInput;
    try {
      const [payload] = service.runCode({
        code: body.code,
        requestsJSON: `[${body.requestJson}]`,
        state: body.state,
      });
      res.json(payload);
    } catch (e) {
      next(e);
    }
  })
  .post(
    "/bulk",
    validate(BulkVMInput),
    async function vmBulkController(req, res, next) {
      const body = req.body as BulkVMInput;
      try {
        const payload = service.runCode({
          code: body.code,
          requestsJSON: body.requestsJson,
          state: body.state,
        });
        res.json(payload);
      } catch (e) {
        next(e);
      }
    }
  );
