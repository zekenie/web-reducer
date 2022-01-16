import { AsyncLocalStorage } from "async_hooks";
import { RequestHandler } from "express";
import { Roarr } from "roarr";
import { v4 as uuid } from "uuid";
import { setSpanAttribute } from "../tracing";

const requestStorage = new AsyncLocalStorage<RequestContext>();
export const getStore = () => {
  return requestStorage.getStore()!;
};

export class RequestContext {
  public readonly id: string = uuid();

  private _userId: string;

  public get userId() {
    return this._userId;
  }

  setUserId(id: string) {
    this._userId = id;
  }
}

export default function makeRequestContextMiddleware(): RequestHandler {
  return function requestContextMiddleware(req, res, next) {
    const context = new RequestContext();
    requestStorage.run(context, () => {
      setSpanAttribute("wr.request.id", context.id);
      Roarr.adopt(
        () => {
          next();
        },
        { requestId: context.id }
      );
    });
  };
}
