import { memoize } from "lodash";
import { createPool } from "slonik";

export const getPool = memoize(
  (id = "default", uri = process.env.DATABASE_URL!) => createPool(uri),
  (...args) => JSON.stringify(args)
);
