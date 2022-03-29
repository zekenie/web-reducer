import { unauthenticatedServerClient } from "./clients";

export async function clear() {
  await unauthenticatedServerClient.post("/test-internals/clear");
}

export async function read(path?: string) {
  const { data } = await unauthenticatedServerClient.get("/test-internals", {
    params: { path },
  });

  return data;
}

export async function allQueuesDrained() {
  await unauthenticatedServerClient.get("/test-internals/all-queues-drained");
}
