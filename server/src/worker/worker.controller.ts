import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { allQueues } from "./queues";

const serverAdapter = new ExpressAdapter();

const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: allQueues().map((q) => new BullMQAdapter(q)),
  serverAdapter: serverAdapter,
});

serverAdapter.setBasePath("/admin/queues");

export default serverAdapter.getRouter();
