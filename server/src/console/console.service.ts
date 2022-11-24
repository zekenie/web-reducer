import * as db from "./console.db";
import {
  PaginatedTokenResponse,
  PaginationQueryArgs,
} from "../pagination/pagination.types";
import { ConsoleMessage } from "./console.types";
import { omit } from "lodash";

export async function getConsolePageForHook({
  hookId,
  paginationArgs,
}: {
  hookId: string;
  paginationArgs: PaginationQueryArgs;
}): Promise<PaginatedTokenResponse<ConsoleMessage>> {
  const page = await db.getConsolePageForHook({ hookId, paginationArgs });
  return {
    ...page,
    objects: page.objects.map((obj) => omit(obj, "id", "stateId", "hookId")),
  };
}
