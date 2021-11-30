"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestContext = exports.getStore = void 0;
const async_hooks_1 = require("async_hooks");
const roarr_1 = require("roarr");
const uuid_1 = require("uuid");
const requestStorage = new async_hooks_1.AsyncLocalStorage();
const getStore = () => {
    console.log(requestStorage.getStore());
    return requestStorage.getStore();
};
exports.getStore = getStore;
class RequestContext {
    constructor() {
        this.id = (0, uuid_1.v4)();
    }
}
exports.RequestContext = RequestContext;
function makeRequestContextMiddleware() {
    return function requestContextMiddleware(req, res, next) {
        const context = new RequestContext();
        requestStorage.run(context, () => {
            roarr_1.Roarr.adopt(() => {
                next();
            }, { requestId: context.id });
        });
    };
}
exports.default = makeRequestContextMiddleware;
