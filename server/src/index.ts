import { config } from "dotenv";
config();

import makeServer from "./server";
import "./worker/all-workers";
import { runWorkers } from "./worker/workers";

runWorkers();

makeServer({}).listen(process.env.PORT!);
