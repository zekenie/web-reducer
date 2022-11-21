import { last } from "lodash";
import { ConsoleRow } from "./console.types";

export function parseNextToken(token: string): {
  id: string;
  timestamp: Date;
} {
  const [id, timestamp] = Buffer.from(token, "base64")
    .toString("utf-8")
    .split("::");

  return {
    id,
    timestamp: new Date(+timestamp),
  };
}

export function generateNextToken({
  hasNext,
  objects,
}: {
  hasNext: boolean;
  objects: ConsoleRow[];
}): string | null {
  if (!hasNext) {
    return null;
  }
  const lastRecord = last(objects)!;
  return Buffer.from(`${lastRecord.id}::${lastRecord.timestamp}`).toString(
    "base64"
  );
}
