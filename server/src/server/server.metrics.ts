import { counter, histogram } from "../metrics";

export const duration = histogram("wr.request.duration", {});
export const requests = counter("wr.request.count", {});

export const forStatusCode = (status: `${number}xx`) => {
  return counter(`wr.request.${status}`, {});
};
