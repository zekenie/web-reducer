---
to: <%= absPath %>
---
export type EMAIL_NAME = "<%= emailName %>";
export const EMAIL_NAME: EMAIL_NAME = "<%= emailName %>";

declare global {
  namespace Email {
    interface EmailTypes {
      [EMAIL_NAME]: {
        name: EMAIL_NAME;
        locals: {};
        from: "zeke@webreducer.dev";
      };
    }
  }
}
