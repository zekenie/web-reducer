// restrict access
// add secret
// remove secret
// see public secrets
import { Router } from "express";
import { makeAccessMiddleware } from "../access/access.middleware";
import { makeAuthMiddleware } from "../auth/auth.middleware";
import validate from "../middleware/validate.middleware";
import CreateSecretInput from "./inputs/create-secret.input";
import {
  deleteSecret,
  getSecretsForNamespace,
  setSecret,
} from "./secret.remote";
import { getAccessKeyForHook } from "./secret.service";
import httpErrors from "http-errors";

export default Router()
  .use(makeAuthMiddleware())
  .use(
    "/:hookId",
    makeAccessMiddleware((req) => req.params.hookId)
  )
  .get("/:hookId", async (req, res, next) => {
    try {
      const accessKey = await getAccessKeyForHook({
        hookId: req.params.hookId,
      });
      res.json({ secrets: await getSecretsForNamespace({ accessKey }) });
    } catch (e) {
      next(e);
    }
  })
  .post("/:hookId", validate(CreateSecretInput), async (req, res, next) => {
    try {
      const accessKey = await getAccessKeyForHook({
        hookId: req.params.hookId,
      });
      await setSecret({ accessKey, key: req.body.key, value: req.body.value });
      res.status(201).json({});
    } catch (e) {
      next(e);
    }
  })
  .delete("/:hookId", async (req, res, next) => {
    try {
      if (!req.query.key || typeof req.query.key !== "string") {
        throw new httpErrors.BadRequest();
      }
      const accessKey = await getAccessKeyForHook({
        hookId: req.params.hookId,
      });
      await deleteSecret({ accessKey, key: req.query.key });
      res.status(201).json({});
    } catch (e) {
      next(e);
    }
  });
