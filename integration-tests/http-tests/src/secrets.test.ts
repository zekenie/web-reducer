import { sql } from "slonik";
import { secretsClient } from "./clients";
import { getPool } from "./db";
import { secretsTestSetup } from "./setup";

describe("secrets", () => {
  // requires auth header

  secretsTestSetup();

  it("creates a namespace and responds with an access key, hashed val saved in db", async () => {
    const { data, status } = await secretsClient.post("/");
    const namespaceRecord = await getPool(
      "default",
      process.env.SECRETS_DATABASE_URL!
    ).one<{ id: string; accessKey: string }>(sql`
      select * from "namespace"
    `);
    expect(status).toEqual(201);
    expect(data).toEqual({ accessKey: expect.any(String) });
    expect(data.accessKey).not.toEqual(namespaceRecord.accessKey);
  });

  it("creates a secret", async () => {
    const { data } = await secretsClient.post("/");

    const { status } = await secretsClient.post(`/${data.accessKey}/secrets`, {
      key: "foo",
      value: "bar",
    });

    expect(status).toEqual(201);
  });

  it("allows overwriting of a secret", async () => {
    const { data } = await secretsClient.post("/");

    const { status } = await secretsClient.post(`/${data.accessKey}/secrets`, {
      key: "foo",
      value: "bar",
    });

    const { status: secondStatus } = await secretsClient.post(
      `/${data.accessKey}/secrets`,
      {
        key: "foo",
        value: "baz",
      }
    );
    const { data: secretsReadData } = await secretsClient.get(
      `/${data.accessKey}/secrets`
    );

    expect(status).toEqual(201);
    expect(secondStatus).toEqual(201);

    expect(secretsReadData).toEqual({ secrets: { foo: "baz" } });
  });

  it("can delete a namespace", async () => {
    const { data } = await secretsClient.post("/");

    const { status: deleteStatus } = await secretsClient.delete(
      `/${data.accessKey}`
    );

    const { status: getStatus } = await secretsClient.get(
      `/${data.accessKey}/secrets`,
      { validateStatus: () => true }
    );

    expect(deleteStatus).toEqual(202);
    expect(getStatus).toEqual(404);
  });

  it("can delete a secret", async () => {
    const { data } = await secretsClient.post("/");

    await secretsClient.post(`/${data.accessKey}/secrets`, {
      key: "foo",
      value: "baz",
    });

    const { status: deleteStatus } = await secretsClient.delete(
      `/${data.accessKey}/secrets`,
      { params: { key: "foo" } }
    );

    const { status: getStatus, data: getData } = await secretsClient.get(
      `/${data.accessKey}/secrets`,
      { validateStatus: () => true }
    );

    expect(deleteStatus).toEqual(202);
    expect(getStatus).toEqual(200);
    expect(getData).toEqual({ secrets: {} });
  });

  it("reads secrets", async () => {
    const { data } = await secretsClient.post("/");

    const { status } = await secretsClient.post(`/${data.accessKey}/secrets`, {
      key: "foo",
      value: "bar",
    });

    const { status: secondStatus } = await secretsClient.post(
      `/${data.accessKey}/secrets`,
      {
        key: "foo2",
        value: "baz",
      }
    );
    const { data: secretsReadData } = await secretsClient.get(
      `/${data.accessKey}/secrets`
    );

    expect(status).toEqual(201);
    expect(secondStatus).toEqual(201);

    expect(secretsReadData).toEqual({ secrets: { foo: "bar", foo2: "baz" } });
  });
});
