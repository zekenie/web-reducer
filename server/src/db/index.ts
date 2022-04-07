import { memoize } from "lodash";
import { createPool } from "slonik";
import { createQueryLoggingInterceptor } from "slonik-interceptor-query-logging";
import { TransactionFunctionType } from "slonik/dist/src/types";

// todo: try this: https://github.com/mmkal/slonik-tools/tree/master/packages/typegen#installation

const interceptors = [createQueryLoggingInterceptor()];

export const getPool = memoize((id = "default") =>
  createPool(process.env.DATABASE_URL!, {
    interceptors,
    captureStackTrace: true,
  })
);

export const transaction = <T>(cb: TransactionFunctionType<T>) =>
  getPool().transaction(cb);
