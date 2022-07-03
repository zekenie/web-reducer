import validate from "../middleware/validate.middleware";
import { Router } from "express";
import * as service from "./vm.service";
import VMInput from "./inputs/vm.input";
import BulkVMInput from "./inputs/bulk-vm.input";
import VMConfigInput from "./inputs/vm-config.input";

export default Router()
  .post(
    "/templates",
    validate(VMConfigInput),
    async function vmConfigController(req, res, next) {
      const body = req.body as VMConfigInput;
      try {
        const results = service.runCode({
          code: body.code,
          requestsJson: `[]`,
          invalidIdempotencyKeys: [],
          secretsJson: `{}`,
          state: body.state,
          mode: "template",
        });
        res.json({
          templates: results.templates,
        });
      } catch (e) {
        next(e);
      }
    }
  )
  .post("/", validate(VMInput), async function vmController(req, res, next) {
    const body = req.body as VMInput;
    try {
      const results = service.runCode({
        code: body.code,
        requestsJson: `[${body.requestJson}]`,
        invalidIdempotencyKeys: [],
        secretsJson: body.secretsJson,
        state: body.state,
        mode: body.mode,
      });
      const [resp] = results.responses;
      res.json(resp);
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
          requestsJson: body.requestsJson,
          invalidIdempotencyKeys: body.invalidIdempotencyKeys,
          state: body.state,
          secretsJson: body.secretsJson,
          mode: "reducer",
        });
        res.json(payload.responses);
      } catch (e) {
        next(e);
      }
    }
  );
