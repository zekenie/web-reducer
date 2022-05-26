import validate from "../middleware/validate.middleware";
import { RequestHandler, Router } from "express";
import * as service from "./namespace.service";
import * as secretService from "../secret/secret.service";
import CreateSecretInput from "./inputs/create-secret.input";
import {
  InvalidKeyParamError,
  MissingKeyParamError,
} from "../secret/secret.errors";

function requireStringQueryParams(...requiredStrings: string[]) {
  const middleware: RequestHandler = (req, res, next) => {
    for (const requiredString of requiredStrings) {
      const str = req.query[requiredString];
      if (!str) {
        return next(new MissingKeyParamError(requiredString));
      }
      if (typeof str !== "string") {
        return next(new InvalidKeyParamError(requiredString));
      }
      if (str.length > 500) {
        return next(new InvalidKeyParamError(requiredString));
      }
    }
    next();
  };

  return middleware;
}

export default Router()
  .post("/", async (req, res, next) => {
    try {
      const { accessKey } = await service.createNamespace();
      res.status(201).json({ accessKey });
    } catch (e) {
      next(e);
    }
  })
  .get(
    "/secrets",
    requireStringQueryParams("accessKey", "mode"),
    async (req, res, next) => {
      try {
        if (!["public", "private"].includes(req.query.mode as string)) {
          throw new InvalidKeyParamError("mode");
        }
        const secrets = await service.getSecretsForNamespace({
          accessKey: req.query.accessKey as string,
          mode: req.query.mode as "public" | "private",
        });
        res.status(200).json({ secrets });
      } catch (e) {
        next(e);
      }
    }
  )
  .post(
    "/secrets",
    validate(CreateSecretInput),
    requireStringQueryParams("accessKey"),
    async (req, res, next) => {
      try {
        await secretService.createSecret({
          accessKey: req.query.accessKey as string,
          key: req.body.key,
          value: req.body.value,
        });
        res.status(201).json({});
      } catch (e) {
        next(e);
      }
    }
  )
  .delete(
    "/",
    requireStringQueryParams("accessKey"),
    async (req, res, next) => {
      try {
        await service.deleteNamespace({
          accessKey: req.query.accessKey as string,
        });
        res.status(202).json({ deleted: true });
      } catch (e) {
        next(e);
      }
    }
  )
  .delete(
    "/secrets",
    requireStringQueryParams("key", "accessKey"),
    async (req, res, next) => {
      try {
        await secretService.deleteSecret({
          accessKey: req.query.accessKey as string,
          key: req.query.key as string,
        });
        res.status(202).json({ deleted: true });
      } catch (e) {
        next(e);
      }
    }
  );
