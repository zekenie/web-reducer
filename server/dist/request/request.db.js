"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureRequest = void 0;
const slonik_1 = require("slonik");
const db_1 = require("../db");
const captureRequest = ({ id, contentType, body, writeKey, }) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("about to generate query");
    const query = (0, slonik_1.sql) `
    insert into request
    ("id", "contentType", "body", "writeKey", "createdAt")
    values
    (${id}, ${contentType}, ${slonik_1.sql.json(body)}, ${writeKey}, NOW())
  `;
    const pool = (0, db_1.getPool)();
    console.log(query.sql);
    yield pool.query(query);
});
exports.captureRequest = captureRequest;
