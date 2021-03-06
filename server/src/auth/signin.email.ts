export type EMAIL_NAME = "signin";
export const EMAIL_NAME: EMAIL_NAME = "signin";

declare global {
  namespace Email {
    interface EmailTypes {
      [EMAIL_NAME]: {
        name: EMAIL_NAME;
        locals: {
          domain: string;
          token: string;
        };
        from: "zeke@webreducer.dev";
      };
    }
  }
}
