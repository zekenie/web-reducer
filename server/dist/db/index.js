"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPool = void 0;
const lodash_1 = require("lodash");
const slonik_1 = require("slonik");
exports.getPool = (0, lodash_1.memoize)((id = "default") => (0, slonik_1.createPool)(process.env.DATABASE_URL));
console.log(process.env.DATABASE_URL);
