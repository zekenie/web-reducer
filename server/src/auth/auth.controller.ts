import { Router } from "express";
import * as service from "./auth.service";
import { makeAuthMiddleware } from "./auth.middleware";
import validate from "../middleware/validate.middleware";
import SignIn from "./inputs/signin.input";
import { getStore } from "../server/request-context.middleware";
import ValidateSignIn from "./inputs/validate-signin.input";

export default Router()
  .post("/guest-user", async (req, res, next) => {
    try {
      const jwt = await service.initiateGuestUser();
      res.status(201).json({
        jwt,
      });
    } catch (e) {
      next(e);
    }
  })
  .post(
    "/validate-signin-token",
    validate(ValidateSignIn),
    async (req, res, next) => {
      try {
        const jwt = await service.validateTokenAndSignJwt(req.body.token);
        res.json({ jwt });
      } catch (e) {
        next(e);
      }
    }
  )
  .use(makeAuthMiddleware())
  .post("/signin", validate(SignIn), async (req, res, next) => {
    try {
      await service.initiateSignin({
        email: req.body.email,
        guestUserId: getStore().userId,
      });

      res.json({});
    } catch (e) {
      next(e);
    }
  });
