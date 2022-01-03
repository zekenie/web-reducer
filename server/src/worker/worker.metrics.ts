import { counter, histogram, upDownCounter } from "../metrics";

export const forWorkerType = (type: string) => ({
  failed: counter(`wr.worker.${type}.failed`, {}),
  succeeded: counter(`wr.worker.${type}.succeeded`, {}),
  size: upDownCounter(`wr.worker.${type}.size`, {}),
  duration: histogram(`wr.worker.${type}.duration`, {}),
});

export const all = forWorkerType("all");
