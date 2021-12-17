import supertest from "supertest";
import makeServer from "../server/index";

const server = makeServer({});

it("rejects invalid json", async () => {
  await supertest(server)
    .post("/")
    .send({
      code: `function reducer() { return 3 }`,
      state: "asdfsdf",
      event: "{}",
    })
    .expect(400);
});

// it("rejects state that is too big", async () => {
//   await supertest(server)
//     .post("/")
//     .send({
//       code: `function reducer(state, event) { return { num: state.num + event.num } }`,
//       state: JSON.stringify(
//         Array.from({ length: 10000 }, () => ({
//           foo: "bar",
//         }))
//       ),
//       event: JSON.stringify({ num: 4 }),
//     })
//     .expect(413);
// });

// it("rejects event that is too big", async () => {
//   await supertest(server)
//     .post("/")
//     .send({
//       code: `function reducer(state, event) { return { num: state.num + event.num } }`,
//       event: JSON.stringify(
//         Array.from({ length: 10000 }, () => ({
//           foo: "bar",
//         }))
//       ),
//       state: JSON.stringify({ num: 4 }),
//     })
//     .expect(413);
// });

// it("rejects code that is too big", async () => {
//   await supertest(server)
//     .post("/")
//     .send({
//       code: `function reducer(state, event) { ${"console.log(state); ".repeat(
//         1000
//       )} return { num: state.num + event.num } }`,
//       event: JSON.stringify({ num: 4 }),
//       state: JSON.stringify({ num: 4 }),
//     })
//     .expect(400);
// });

// it("accepts inputs that are the right size", async () => {
//   const { body } = await supertest(server)
//     .post("/")
//     .send({
//       code: `function reducer(state, event) { return { num: state.num + event.num } }`,
//       state: JSON.stringify({ num: 4 }),
//       event: JSON.stringify({ num: 4 }),
//     })
//     .expect(200);

//   expect(body).toEqual(expect.objectContaining({ result: { num: 8 } }));
// });
