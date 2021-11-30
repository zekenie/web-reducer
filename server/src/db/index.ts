import { memoize } from "lodash";
import { createPool } from "slonik";

export const getPool = memoize((id = "default") =>
  createPool(process.env.DATABASE_URL!)
);
