import { last } from "lodash";
import { StateHistory } from "./state.types";

export function parseNextToken(token: string): {
  requestId: string;
  createdAt: Date;
} {
  const [requestId, createdAt] = Buffer.from(token, "base64")
    .toString("utf-8")
    .split("::");

  return {
    requestId,
    createdAt: new Date(+createdAt),
  };
}

export function generateNextToken({
  hasNext,
  objects,
}: {
  hasNext: boolean;
  objects: StateHistory[];
}): string | null {
  if (!hasNext) {
    return null;
  }
  const lastRecord = last(objects)!;
  return Buffer.from(
    `${lastRecord.requestId}::${lastRecord.createdAt}`
  ).toString("base64");
}
