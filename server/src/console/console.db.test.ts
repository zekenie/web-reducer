import { range } from "lodash";
import hookFactory from "../hook/hook.factory";
import { cleanup } from "../spec-helpers/db-cleanup";
import stateFactory from "../state/state.factory";
import {
  bulkInsertConsole,
  getConsoleByStateIds,
  getConsolePage,
} from "./console.db";
import consoleFactory from "./console.factory";

describe("console.db", () => {
  beforeEach(cleanup);
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
            hookId: state.hookId,
          },
          {
            stateId: state.id,
            requestId: state.requestId,
            level: "warn",
            messages: ["foo", "bar", "baz"],
            hookId: state.hookId,
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

  describe("getConsolePage", () => {
    it("returns an empty page to start", async () => {
      const hook = await hookFactory.create();
      const res = await getConsolePage({
        hookId: hook.id,
        paginationArgs: { pageSize: 5 },
      });

      expect(res).toEqual({
        nextToken: null,
        objects: [],
      });
    });

    it("returns a page", async () => {
      const hook = await hookFactory.create();
      const consoles = await consoleFactory
        .associations({ hookId: hook.id })
        .createList(4);
      const res = await getConsolePage({
        hookId: hook.id,
        paginationArgs: { pageSize: 5 },
      });

      expect(res).toEqual({
        nextToken: null,
        objects: expect.arrayContaining(
          consoles.map((c) => expect.objectContaining({ id: c.id }))
        ),
      });
    });

    it("paginates", async () => {
      const hook = await hookFactory.create();

      for (const i of range(6)) {
        await consoleFactory
          .params({ timestamp: new Date(Date.now() - i * 10_000) })
          .associations({ hookId: hook.id })
          .create();
      }

      const page1 = await getConsolePage({
        hookId: hook.id,
        paginationArgs: { pageSize: 5 },
      });

      expect(page1.nextToken).toEqual(expect.any(String));

      expect(page1.objects.length).toEqual(5);

      const page2 = await getConsolePage({
        hookId: hook.id,
        paginationArgs: { pageSize: 5, token: page1.nextToken! },
      });

      expect(page2.objects.length).toEqual(1);
    });
  });

  describe("getConsoleByStateIds", () => {
    it("gets console logs by state ids", async () => {
      const consoles = await consoleFactory
        .params({ messages: ["foo", "bar"] })
        .transient({ withState: true })
        .createList(3);
      const [c, c1, c2] = consoles;
      expect(
        await getConsoleByStateIds({
          stateIds: consoles.map((c) => c.stateId!),
        })
      ).toEqual(
        expect.objectContaining({
          [c.stateId!]: expect.arrayContaining([
            expect.objectContaining({ messages: ["foo", "bar"] }),
          ]),
          [c1.stateId!]: expect.arrayContaining([
            expect.objectContaining({ messages: ["foo", "bar"] }),
          ]),
          [c2.stateId!]: expect.arrayContaining([
            expect.objectContaining({ messages: ["foo", "bar"] }),
          ]),
        })
      );
    });
  });
});
