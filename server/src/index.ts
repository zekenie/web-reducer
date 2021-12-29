import { config } from "dotenv";
import { getPool } from "./db";
import { connection as redisConnection } from "./redis";
config();

import makeServer from "./server";
import "./worker/all-workers";
import { runWorkers } from "./worker/workers";

runWorkers();

const server = makeServer({}).listen(process.env.PORT!);

function closeGracefully(signal: string) {
  try {
    console.log(`*^!@4=> Received signal to terminate: ${signal}`);

    server.close(async () => {
      try {
        await redisConnection.quit();
        const pool = getPool();
        await pool.end();
      } catch (e) {
        return process.exit(1);
      }
      process.exit();
    });
  } catch (e) {
    console.error("error responding to ", signal);
    process.exit(1);
  }
}
process.on("SIGINT", closeGracefully);
process.on("SIGTERM", closeGracefully);
