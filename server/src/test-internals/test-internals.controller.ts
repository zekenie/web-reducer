import { Router } from "express";
import * as service from "./test-internals.service";

const router = Router();

if (process.env.NODE_ENV === "test") {
  router.post("/clear", (req, res) => {
    service.clear();
    res.json({});
  });

  router.get<"/", {}, {}, {}, { path: string }>("/", (req, res) => {
    res.json(service.read(req.query.path));
  });

  router.get("/all-queues-drained", async (req, res) => {
    await service.resolveWhenAllQueuesAreDrained();
    res.json({});
  });
}

export default router;
