import { Artifacts } from "./artifacts";

type MessageLogger = (...messages: string[]) => void;
export type LogLevels = "warn" | "error" | "log" | "trace" | "debug" | "info";

const levels = ["warn", "error", "log", "trace", "debug", "info"] as Readonly<
  LogLevels[]
>;

export class VMConsole {
  error: MessageLogger;
  warn: MessageLogger;
  log: MessageLogger;
  trace: MessageLogger;
  debug: MessageLogger;
  info: MessageLogger;
  constructor(private artifacts: Artifacts) {
    for (const level of levels) {
      this[level] = (...messages: string[]) => {
        if (this.artifacts.latestArtifact)
          this.artifacts.latestArtifact.log({
            level,
            messages: messages.map(this.formatMessage),
            timestamp: Date.now(),
          });
      };
    }
  }

  private formatMessage(message: any) {
    if (typeof message === "object") {
      try {
        return JSON.stringify(message, null, 2);
      } catch (e) {
        return "[Unserializable object]";
      }
    }
    if (message.toString) {
      return message.toString();
    }
  }
}
