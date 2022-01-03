import { counter, histogram, upDownCounter } from "../metrics";

export const writeKeyCounter = counter("wr.request.writeKey", {
  description: "new request received on a web reducer",
});

export const captureBatchSize = histogram("wr.request.captureBatchSize", {});
