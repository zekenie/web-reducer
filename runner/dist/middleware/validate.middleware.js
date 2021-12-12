"use strict";
// this file came from here: https://raw.githubusercontent.com/ISNIT0/express-class-validator/master/lib/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
const class_transformer_validator_1 = require("class-transformer-validator");
const isProd = process.env.NODE_ENV === "production";
function validate(c, whitelist = true, errorHandler) {
    return function ExpressClassValidate(req, res, next) {
        const toValidate = req.body;
        if (!toValidate) {
            if (errorHandler) {
                errorHandler({ type: "no-body" }, req, res, next);
            }
            else {
                res.status(400).json(Object.assign({ error: true, message: "Validation failed" }, (isProd
                    ? {}
                    : { originalError: { message: "No request body found" } })));
            }
        }
        else {
            (0, class_transformer_validator_1.transformAndValidate)(c, toValidate, { validator: { whitelist } })
                .then((transformed) => {
                req.body = transformed;
                next();
            })
                .catch((err) => {
                if (errorHandler) {
                    errorHandler(err, req, res, next);
                }
                else {
                    res.status(400).json(Object.assign({ error: true, message: "Validation failed" }, (isProd ? {} : { originalError: err })));
                }
            });
        }
    };
}
exports.default = validate;
