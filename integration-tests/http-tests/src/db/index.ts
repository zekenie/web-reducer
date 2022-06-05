import { memoize } from "lodash";
import { createPool } from "slonik";

export const getPool = memoize(
  (id = "default", uri = process.env.DATABASE_URL!) =>
    createPool(uri, {
      maximumPoolSize: 1,
      idleTimeout: 1,
    }),
  (...args) => JSON.stringify(args)
);
