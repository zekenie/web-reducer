import supertest from "supertest";
import makeServer from "../server/index";

const server = makeServer({});

describe("single", () => {
  it("rejects invalid json", async () => {
    await supertest(server)
      .post("/")
      .send({
        code: `function reducer() { return 3 }`,
        state: "asdfsdf",
        requestJson: "{ headers: {}, body: {}}",
      })
      .expect(400);
  });

  it("rejects state that is too big", async () => {
    await supertest(server)
      .post("/")
      .send({
        code: `function reducer(state, event) { return { num: state.num + event.num } }`,
        state: JSON.stringify(
          Array.from({ length: 10000 }, () => ({
            foo: "bar",
          }))
        ),
        requestJson: JSON.stringify({ body: { num: 4 }, headers: {} }),
      })
      .expect(413);
  });

  it("rejects event that is too big", async () => {
    await supertest(server)
      .post("/")
      .send({
        code: `function reducer(state, event) { return { num: state.num + event.num } }`,
        requestJson: JSON.stringify(
          Array.from({ length: 4000 }, () => ({
            body: { foo: "bar" },
            headers: {},
          }))
        ),
        state: JSON.stringify({ num: 4 }),
      })
      .expect(413);
  });

  it("rejects code that is too big", async () => {
    await supertest(server)
      .post("/")
      .send({
        code: `function reducer(state, event) { ${"console.log(state); ".repeat(
          1000
        )} return { num: state.num + event.num } }`,
        requestJson: JSON.stringify({ body: { num: 4 }, headers: {} }),
        state: JSON.stringify({ num: 4 }),
      })
      .expect(400);
  });

  it("accepts inputs that are the right size", async () => {
    const { body } = await supertest(server)
      .post("/")
      .send({
        code: `function reducer(state, { body }) { return { num: state.num + body.num } }`,
        requestJson: JSON.stringify({ body: { num: 4 }, headers: {} }),
        state: JSON.stringify({ num: 4 }),
      })
      .expect(200);
    expect(body).toEqual(expect.objectContaining({ state: { num: 8 } }));
  });
});

describe("bulk", () => {
  it("accepts inputs that are the right size", async () => {
    const { body } = await supertest(server)
      .post("/bulk")
      .send({
        code: `function reducer(state, { body }) { return { num: state.num + body.num } }`,
        requestsJson: JSON.stringify([
          { body: { num: 4 }, headers: {} },
          { body: { num: 4 }, headers: {} },
        ]),
        state: JSON.stringify({ num: 4 }),
      })
      .expect(200);
    expect(body).toEqual(
      expect.arrayContaining([expect.objectContaining({ state: { num: 12 } })])
    );
  });
});
