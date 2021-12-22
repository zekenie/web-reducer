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
        requestJson: JSON.stringify({ id: "1", body: { num: 4 }, headers: {} }),
        state: JSON.stringify({ num: 4 }),
      })
      .expect(200);
    expect(body).toEqual(
      expect.objectContaining({ id: expect.any(String), state: { num: 8 } })
    );
  });

  it("accepts empty state", async () => {
    const { body } = await supertest(server)
      .post("/")
      .send({
        code: `function reducer(state = { num: 4 }, { body }) { return { num: state.num + body.num } }`,
        requestJson: JSON.stringify({ id: "1", body: { num: 4 }, headers: {} }),
      })
      .expect(200);
    expect(body).toEqual(
      expect.objectContaining({ id: expect.any(String), state: { num: 8 } })
    );
  });

  it("rejects empty requests json", async () => {
    await supertest(server)
      .post("/")
      .send({
        code: `function reducer(state = { num: 4 }, { body }) { return { num: state.num + body.num } }`,
        state: JSON.stringify({ num: 4 }),
      })
      .expect(400);
  });
});

describe("bulk", () => {
  it("accepts inputs that are the right size", async () => {
    const { body } = await supertest(server)
      .post("/bulk")
      .send({
        code: `function reducer(state, { body }) { return { num: state.num + body.num } }`,
        requestsJson: JSON.stringify([
          { id: "1", body: { num: 4 }, headers: {} },
          { id: "2", body: { num: 4 }, headers: {} },
        ]),
        state: JSON.stringify({ num: 4 }),
      })
      .expect(200);
    expect(body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: expect.any(String), state: { num: 12 } }),
      ])
    );
  });
});
