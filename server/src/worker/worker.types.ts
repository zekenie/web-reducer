type Keys<T> = keyof T;

// https://dev.to/safareli/pick-omit-and-union-types-in-typescript-4nd9
type DistributiveKeys<T> = T extends unknown ? Keys<T> : never;
type DistributivePick<T, K extends DistributiveKeys<T>> = T extends unknown
  ? Pick<T, Extract<keyof T, K>>
  : never;

export type DistributiveOmit<
  T,
  K extends DistributiveKeys<T>
> = T extends unknown ? Omit<T, Extract<keyof T, K>> : never;

declare global {
  namespace Queue {
    interface WorkerTypes {}
  }
}

export type JobDescription = DistributivePick<
  Queue.WorkerTypes[keyof Queue.WorkerTypes],
  "name" | "input"
>;
