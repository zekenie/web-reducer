import { config } from "dotenv";
config();

import makeServer from "./server";
import "./worker/all-workers";

makeServer({}).listen(process.env.PORT!);
