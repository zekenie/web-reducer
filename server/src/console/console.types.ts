export type LogLevels = "warn" | "error" | "log" | "trace" | "debug" | "info";

export type ConsoleMessageInsert = {
  stateId?: string;
} & ConsoleMessage;

export type ConsoleMessage = {
  level: LogLevels;
  messages: string[];
  timestamp: Date;
  requestId?: string;
};

export type ConsoleRow = {
  id: string;
  level: LogLevels;
  messages: string[];
  timestamp: Date;
  requestId?: string;
  stateId: string;
};
