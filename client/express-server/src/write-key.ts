import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

export const writeKeyHandler = Router().use(
  "/:writeKey",
  createProxyMiddleware({ target: `${process.env.BACKEND_URL!}` })
);
