import { config } from "dotenv";
config();

import makeServer from "./server";

const server = makeServer({ onError: (err) => console.error(err) }).listen(
  process.env.PORT!,
  () => {
    console.log("code runner on port", process.env.PORT!);
  }
);

function closeGracefully(signal: string) {
  console.log(`*^!@4=> Received signal to terminate: ${signal}`);

  server.close(() => {
    // await db.close() if we have a db connection in this app
    // await other things we should cleanup nicely
    process.exit();
  });
}
process.on("SIGINT", closeGracefully);
process.on("SIGTERM", closeGracefully);
