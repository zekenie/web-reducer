import type { Request } from "~/remote/hook-client.server";

export type SocketMessage =
  | {
      type: "new-request";
      request: Request;
      requestCount: number;
      readKeys: string[];
      hookId: string;
    }
  | {
      type: "bulk-update";
      hookId: string;
    };
