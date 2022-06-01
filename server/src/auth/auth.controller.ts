import { Router } from "express";
import * as service from "./auth.service";
import { makeAuthMiddleware } from "./auth.middleware";
import validate from "../middleware/validate.middleware";
import SignIn from "./inputs/signin.input";
import { getStore } from "../server/request-context.middleware";
import ValidateSignIn from "./inputs/validate-signin.input";
import RefreshToken from "./inputs/refresh-token.input";
import createHttpError from "http-errors";
import jwtLib from "jsonwebtoken";
import { getUserDetails } from "../user/user.service";

export default Router()
  .post("/guest-user", async (req, res, next) => {
    try {
      const creds = await service.initiateGuestUser();
      res.status(201).json(creds);
    } catch (e) {
      next(e);
    }
  })
  .post(
    "/validate-signin-token",
    validate(ValidateSignIn),
    async (req, res, next) => {
      try {
        const creds = await service.validateTokenAndIssueCredentials(
          req.body.token
        );
        res.json(creds);
      } catch (e) {
        next(e);
      }
    }
  )
  /**
   * This route could have an expired (or heck even invalid jwt)
   * We want someone to have to show 2 kinds of proof to use a refresh token
   * If they don't even know the uuid of the user, then they can't use the token.
   */
  .post("/refresh-token", validate(RefreshToken), async (req, res, next) => {
    try {
      if (!req.headers.authorization) {
        throw new createHttpError.Unauthorized();
      }
      const parsedJwt = jwtLib.decode(req.headers.authorization, {
        json: true,
      });

      res.json(
        await service.issueNewCredentialsForRefreshToken({
          token: req.body.token,
          userId: parsedJwt?.sub!,
        })
      );
    } catch (e) {
      next(e);
    }
  })
  .use(makeAuthMiddleware())
  .get("/me", async (req, res, next) => {
    try {
      const { userId } = getStore();
      const details = await getUserDetails({ userId });
      res.json(details);
    } catch (e) {
      next(e);
    }
  })
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
