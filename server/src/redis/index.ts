import IORedis from "ioredis";

export const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  family: process.env.NODE_ENV! === "production" ? 6 : undefined,
});
