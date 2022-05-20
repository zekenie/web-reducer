import validate from "../middleware/validate.middleware";
import { Router } from "express";
import * as service from "./namespace.service";
import * as secretService from "../secret/secret.service";
import CreateSecretInput from "./inputs/create-secret.input";
import {
  InvalidKeyParamError,
  MissingKeyParamError,
} from "../secret/secret.errors";

export default Router()
  .post("/", async (req, res, next) => {
    try {
      const { accessKey } = await service.createNamespace();
      res.status(201).json({ accessKey });
    } catch (e) {
      next(e);
    }
  })
  .get("/:accessKey/secrets", async (req, res, next) => {
    try {
      const secrets = await service.getSecretsForNamespace({
        accessKey: req.params.accessKey,
      });
      res.status(200).json({ secrets });
    } catch (e) {
      next(e);
    }
  })
  .post(
    "/:accessKey/secrets",
    validate(CreateSecretInput),
    async (req, res, next) => {
      try {
        await secretService.createSecret({
          accessKey: req.params.accessKey,
          key: req.body.key,
          value: req.body.value,
        });
        res.status(201).json({});
      } catch (e) {
        next(e);
      }
    }
  )
  .delete("/:accessKey", async (req, res, next) => {
    try {
      await service.deleteNamespace({ accessKey: req.params.accessKey });
      res.status(202).json({ deleted: true });
    } catch (e) {
      next(e);
    }
  })
  .delete("/:accessKey/secrets", async (req, res, next) => {
    try {
      if (!req.query.key) {
        throw new MissingKeyParamError();
      }
      if (typeof req.query.key !== "string") {
        throw new InvalidKeyParamError();
      }
      await secretService.deleteSecret({
        accessKey: req.params.accessKey,
        key: req.query.key,
      });
      res.status(202).json({ deleted: true });
    } catch (e) {
      next(e);
    }
  });
