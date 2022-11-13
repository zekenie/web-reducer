import stateFactory from "../state/state.factory";
import { bulkInsertConsole, getConsoleByStateIds } from "./console.db";
import consoleFactory from "./console.factory";

describe("console.db", () => {
  describe("bulkInsertConsole", () => {
    it("inserts multiple console rows", async () => {
      const state = await stateFactory.create();

      await bulkInsertConsole({
        consoleLogs: [
          {
            stateId: state.id,
            requestId: state.requestId,
            level: "warn",
            messages: ["foo", "bar"],
            timestamp: new Date(),
          },
          {
            stateId: state.id,
            requestId: state.requestId,
            level: "warn",
            messages: ["foo", "bar", "baz"],
            timestamp: new Date(),
          },
        ],
      });

      expect(await getConsoleByStateIds({ stateIds: [state.id] })).toEqual({
        [state.id]: [
          {
            stateId: state.id,
            requestId: state.requestId,
            level: "warn",
            messages: ["foo", "bar"],
            timestamp: expect.any(Date),
          },
          {
            stateId: state.id,
            requestId: state.requestId,
            level: "warn",
            messages: ["foo", "bar", "baz"],
            timestamp: expect.any(Date),
          },
        ],
      });
    });
  });

  describe("getConsoleByStateIds", () => {
    it("gets console logs by state ids", async () => {
      const consoles = await consoleFactory
        .params({ messages: ["foo", "bar"] })
        .createList(3);
      const [c, c1, c2] = consoles;
      expect(
        await getConsoleByStateIds({ stateIds: consoles.map((c) => c.stateId) })
      ).toEqual(
        expect.objectContaining({
          [c.stateId]: expect.arrayContaining([
            expect.objectContaining({ messages: ["foo", "bar"] }),
          ]),
          [c1.stateId]: expect.arrayContaining([
            expect.objectContaining({ messages: ["foo", "bar"] }),
          ]),
          [c2.stateId]: expect.arrayContaining([
            expect.objectContaining({ messages: ["foo", "bar"] }),
          ]),
        })
      );
    });
  });
});
