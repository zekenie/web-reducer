import { config } from "dotenv";
config();
import tracing from "./tracing";

import { getPool } from "./db";
import { connection as redisConnection } from "./redis";
import { connection as redisPublisherConnection } from "./runner/runner.publisher";
import "./worker/all-workers";
import { runWorkers } from "./worker/workers";
import { shutDownAllQueues } from "./worker/queues";

tracing.start().then(async () => {
  const { shutDownAllWorkers } = runWorkers();

  const { default: makeServer } = await import("./server");

  const server = makeServer({}).listen(process.env.PORT!, () => {
    console.log("server listening on port", process.env.PORT!);
  });

  function closeGracefully(signal: string) {
    try {
      console.log(`*^!@4=> Received signal to terminate: ${signal}`);

      server.close(async () => {
        try {
          await shutDownAllQueues();
          await shutDownAllWorkers();
          await redisConnection.quit();
          await redisPublisherConnection.quit();
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
});
