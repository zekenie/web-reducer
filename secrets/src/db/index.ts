import { memoize } from "lodash";
import { createPool } from "slonik";
import { TransactionFunction } from "slonik/dist/src/types";

export const getPool = memoize((id = "default") =>
  createPool(process.env.DATABASE_URL!, {
    captureStackTrace: true,
  })
);

export const transaction = <T>(cb: TransactionFunction<T>) =>
  getPool().transaction(cb);
