export type KeysByType = {
  writeKeys: string[];
  readKeys: string[];
};

export type KeyWorkflowState = "paused" | "live";
export type KeyType = "read" | "write";

export type KeyRecord = {
  key: string;
  workflowState: KeyWorkflowState;
  type: KeyType;
};
