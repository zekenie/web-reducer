import { config } from "dotenv";
config();

import makeServer from "./server";

makeServer({}).listen(process.env.PORT!);
