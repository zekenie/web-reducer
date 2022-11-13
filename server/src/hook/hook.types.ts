import { KeysByType } from "../key/key.types";

export enum VersionWorkflowState {
  DRAFT = "draft",
  PUBLISHED = "published",
  OLD = "old",
}

export enum HookWorkflowState {
  LIVE = "live",
  PAUSED = "paused",
}

export type HookCode = {
  [VersionWorkflowState.PUBLISHED]?: string;
  [VersionWorkflowState.DRAFT]: string;
};

export type HookDetail = HookOverview & KeysByType & HookCode;

export type HookOverview = {
  id: string;
  name: string;
  description?: string;
  workflowState: HookWorkflowState;
  requestCount: number;
};

export type HookRow = {
  id: string;
  createdAt: Date;
  workflowState: HookWorkflowState;
  name: string;
  // @todo, this is not marked as `not null` but should it be?
  secretAccessKey: string;
  description?: string;
  requestCount: number;
};

export type VersionRow = {
  id: string;
  code: string;
  compiledCode?: string;
  hookId: string;
  createdAt: Date;
  updatedAt: Date;
  workflowState: VersionWorkflowState;
};
