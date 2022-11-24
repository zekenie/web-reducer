import { last } from "lodash";
import { ConsoleRow } from "./console.types";

export function parseNextToken(token: string): {
  id: string;
  number?: number;
} {
  const [id, number] = Buffer.from(token, "base64")
    .toString("utf-8")
    .split("::");

  console.log(id, number);

  return {
    id,
    number: number ? +number : undefined,
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
  return Buffer.from(`${lastRecord.id}::${lastRecord.number}`).toString(
    "base64"
  );
}
