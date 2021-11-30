"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const request_context_middleware_1 = __importDefault(require("./request-context.middleware"));
const request_controller_1 = __importDefault(require("../request/request.controller"));
const body_parser_xml_1 = __importDefault(require("body-parser-xml"));
(0, body_parser_xml_1.default)(body_parser_1.default);
function makeServer(config) {
    const app = (0, express_1.default)();
    app.use(body_parser_1.default.json());
    app.use(body_parser_1.default.xml());
    app.use(body_parser_1.default.urlencoded({ extended: true }));
    app.use((0, request_context_middleware_1.default)());
    app.use("/", request_controller_1.default);
    return app;
}
exports.default = makeServer;
