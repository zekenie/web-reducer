"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const vm_controller_1 = __importDefault(require("../vm/vm.controller"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
function makeServer(config) {
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)());
    app.use((0, morgan_1.default)("dev"));
    app.use(body_parser_1.default.json());
    app.use(body_parser_1.default.urlencoded({ extended: true }));
    app.use(vm_controller_1.default);
    app.get("/heartbeat", (req, res) => {
        res.json({ ok: true });
    });
    app.use(function errorHandler(err, req, res, next) {
        if (config.onError) {
            config.onError(err);
        }
        res.status(err.status || 500);
        res.json({ message: err.message, name: err.name });
        return;
    });
    return app;
}
exports.default = makeServer;
