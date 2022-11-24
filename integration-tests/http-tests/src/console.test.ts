import { range } from "lodash";
import { buildHook } from "./hook-builder";
import { serverTestSetup } from "./setup";

describe("hook console", () => {
  serverTestSetup();

  it("returns an empty page for a new hook", async () => {
    const { api } = await buildHook();
    expect(await api.console()).toEqual({
      console: {
        nextToken: null,
        objects: [],
      },
    });
  });

  it("returns data", async () => {
    const bodies = [{ foo: "bar" }];
    const { api } = await buildHook({
      bodies,
      code: `
        function reducer() {
          for (let i = 0; i < 5 i++) {
            console.log(i)
          }
          return {}
        }
      `,
    });
    await api.settled(bodies[0]);
    const expectation = range(5)
      .map((i) =>
        expect.objectContaining({
          messages: [i.toString()],
        })
      )
      .reverse();

    const consoleResp = await api.console();
    expect(consoleResp).toEqual({
      console: {
        nextToken: null,
        objects: expectation,
      },
    });
  });

  it("returns multiple pages", async () => {
    const bodies = [{ foo: "bar" }];
    const { api } = await buildHook({
      bodies,
      code: `
        function reducer() {
          for (let i = 0; i < 50 i++) {
            console.log(i)
          }
          return {}
        }
      `,
    });
    await api.settled(bodies[0]);

    const expectation = range(50)
      .map((i) =>
        expect.objectContaining({
          messages: [i.toString()],
        })
      )
      .reverse();

    const consoleResp = await api.console();

    expect(consoleResp).toEqual({
      console: {
        nextToken: expect.any(String),
        objects: expectation.slice(0, 40),
      },
    });

    const secondConsolePage = await api.console({
      nextToken: consoleResp.console.nextToken!,
    });

    expect(secondConsolePage).toEqual({
      console: {
        nextToken: null,
        objects: expectation.slice(40),
      },
    });
  });
});
