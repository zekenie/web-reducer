import { buildHook } from "./hook-builder";
import { serverTestSetup } from "./setup";

describe("templates", () => {
  serverTestSetup();
  it("has no templates for a hook without templates", async () => {
    const { api } = await buildHook();
    expect(await api.templates()).toHaveLength(0);
  });

  it("has template defined by code", async () => {
    const { api } = await buildHook({
      code: `
        template('foo', () => ({ bar: 'baz' }))
      `,
    });
    expect(await api.templates()).toHaveLength(1);
  });

  it("can use state", async () => {
    const { api } = await buildHook({
      code: `function reducer () {
        return { foo: 'bar' }
      }
      
      template('foo', (s = {}) => ({ state: s )})
      `,
    });
    const body = { number: 4 };
    await api.write(body, {});

    await api.settled(body);
    expect(await api.templates()).toContainEqual({
      name: "foo",
      template: {
        state: { foo: "bar" },
      },
    });
  });
});
