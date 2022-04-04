import { testSetup } from "./setup";

describe("/publish", () => {
  testSetup();
  describe("as an unauthenticated client", () => {
    it.todo("should reject requests");
  });
  describe("as an authenticated client who does not have access", () => {
    it.todo("should reject the request");
  });

  describe("as a properly authenticated client", () => {
    it.todo("pauses request execution");
    it.todo(
      "marks current version as old, current draft as published and creates a new draft"
    );
    it.todo("bulk processes existing requests");
    it.todo("resumes request execution");
  });
});
