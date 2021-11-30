import { AsyncLocalStorage } from "async_hooks";
import { RequestHandler } from "express";
import { Roarr } from "roarr";
import { v4 as uuid } from "uuid";

const requestStorage = new AsyncLocalStorage<RequestContext>();

export const getStore = () => {
  return requestStorage.getStore()!;
};

export class RequestContext {
  public readonly id: string = uuid();
}

export default function makeRequestContextMiddleware(): RequestHandler {
  return function requestContextMiddleware(req, res, next) {
    const context = new RequestContext();
    requestStorage.run(context, () => {
      Roarr.adopt(
        () => {
          next();
        },
        { requestId: context.id }
      );
    });
  };
}
