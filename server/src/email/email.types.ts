declare global {
  namespace Email {
    interface EmailTypes {}
  }
}

export type SendMail = {
  from: string;
  to: string;
  template: string;
  locals: Record<string, string>;
};
