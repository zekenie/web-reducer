/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testPathIgnorePatterns: ["dist/"],
  testEnvironment: "node",
  setupFiles: ["dotenv/config"],
};
