import supertest from "supertest";
import makeServer from "./index";

const server = makeServer({});

it("accepts heartbeat requests", async () => {
  const { body } = await supertest(server).get("/heartbeat").expect(200);
  expect(body).toEqual({ ok: true });
});
