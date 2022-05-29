"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const server_1 = __importDefault(require("./server"));
const server = (0, server_1.default)({ onError: (err) => console.error(err) }).listen(process.env.PORT, () => {
    console.log("code runner on port", process.env.PORT);
});
function closeGracefully(signal) {
    console.log(`*^!@4=> Received signal to terminate: ${signal}`);
    server.close(() => {
        // await db.close() if we have a db connection in this app
        // await other things we should cleanup nicely
        process.exit();
    });
}
process.on("SIGINT", closeGracefully);
process.on("SIGTERM", closeGracefully);
const https = require("https");
const options = {
    hostname: "google.com",
    port: 443,
    path: "/",
    method: "GET",
};
// @ts-expect-error
const req = https.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);
    // @ts-expect-error
    res.on("data", (d) => {
        process.stdout.write(d);
    });
});
// @ts-expect-error
req.on("error", (error) => {
    console.error(error);
});
req.end();
