export type User = {
  id: string;
  email?: string;
};

type UserWorkflowState = "guest" | "user";

export type UserDetails = User & {
  workflowState: UserWorkflowState;
};
