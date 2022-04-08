import { allQueuesAndEvents } from "../worker/queues";

let internals: { [key: string]: any } = {};

export function add<T = any>(name: string, payload?: T) {
  if (process.env.NODE_ENV !== "test") {
    return;
  }
  internals[name] = internals[name] || [];

  internals[name].unshift({ ts: Date.now(), payload });
}

export function clear(path?: string) {
  if (process.env.NODE_ENV !== "test") {
    return;
  }
  if (!path) {
    internals = {};
    return;
  }
  internals[path] = [];
}

export function read(path: string) {
  if (process.env.NODE_ENV !== "test") {
    return [];
  }
  return internals[path] || [];
}

export async function resolveWhenAllQueuesAreDrained(attempt = 0) {
  if (attempt >= 2) {
    return;
  }
  const queueEvents = allQueuesAndEvents();
  for (const q of queueEvents) {
    const count = await q.queue.count();
    if (count > 0) {
      await new Promise(async (resolve) => {
        q.queueEvents.on("drained", resolve);
      });
    }
  }
  await resolveWhenAllQueuesAreDrained(attempt + 1);
}
