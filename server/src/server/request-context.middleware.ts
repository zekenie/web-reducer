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
  private _isSignedIn: boolean;

  public get userId() {
    return this._userId;
  }

  setUser({ id, isSignedIn }: { id: string; isSignedIn: boolean }) {
    this._userId = id;
    this._isSignedIn = isSignedIn;
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
