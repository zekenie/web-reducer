import { sql } from "slonik";
import { secretsClient } from "./clients";
import { getPool } from "./db";
import { secretsTestSetup, serverTestSetup } from "./setup";
import crypto from "crypto";
import { buildHook } from "./hook-builder";

export function sha256(message: string) {
  const shasum = crypto.createHash("sha256");
  shasum.update(message);
  return shasum.digest("hex");
}

describe("secrets", () => {
  secretsTestSetup();
  describe("hitting service directly", () => {
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

      const { status } = await secretsClient.post(
        `/secrets`,
        {
          key: "foo",
          value: "bar",
        },
        { params: { accessKey: data.accessKey } }
      );

      expect(status).toEqual(201);
    });

    it("allows overwriting of a secret", async () => {
      const { data } = await secretsClient.post("/");

      const { status } = await secretsClient.post(
        `/secrets`,
        {
          key: "foo",
          value: "bar",
        },
        { params: { accessKey: data.accessKey } }
      );

      const { status: secondStatus } = await secretsClient.post(
        `/secrets`,
        {
          key: "foo",
          value: "baz",
        },
        { params: { accessKey: data.accessKey } }
      );
      const { data: secretsReadData } = await secretsClient.get(`/secrets`, {
        params: { accessKey: data.accessKey, mode: "private" },
      });

      expect(status).toEqual(201);
      expect(secondStatus).toEqual(201);

      expect(secretsReadData).toEqual({ secrets: { foo: "baz" } });
    });

    it("can delete a namespace", async () => {
      const { data } = await secretsClient.post("/");

      const { status: deleteStatus } = await secretsClient.delete("/", {
        params: { accessKey: data.accessKey },
      });

      const { status: getStatus } = await secretsClient.get(`/secrets`, {
        validateStatus: () => true,
        params: { accessKey: data.accessKey, mode: "public" },
      });

      expect(deleteStatus).toEqual(202);
      expect(getStatus).toEqual(404);
    });

    it("can delete a secret", async () => {
      const { data } = await secretsClient.post("/");

      await secretsClient.post(
        `/secrets`,
        {
          key: "foo",
          value: "baz",
        },
        { params: { key: "foo", accessKey: data.accessKey } }
      );

      const { status: deleteStatus } = await secretsClient.delete(`/secrets`, {
        params: { key: "foo", accessKey: data.accessKey },
      });

      const { status: getStatus, data: getData } = await secretsClient.get(
        `/secrets`,
        {
          validateStatus: () => true,
          params: { accessKey: data.accessKey, mode: "private" },
        }
      );

      expect(deleteStatus).toEqual(202);
      expect(getStatus).toEqual(200);
      expect(getData).toEqual({ secrets: {} });
    });

    it("reads secrets in private mode", async () => {
      const { data } = await secretsClient.post("/");

      const { status } = await secretsClient.post(
        `/secrets`,
        {
          key: "foo",
          value: "bar",
        },
        { params: { accessKey: data.accessKey } }
      );

      const { status: secondStatus } = await secretsClient.post(
        `/secrets`,
        {
          key: "foo2",
          value: "baz",
        },
        { params: { accessKey: data.accessKey } }
      );
      const { data: secretsReadData } = await secretsClient.get(`/secrets`, {
        params: { accessKey: data.accessKey, mode: "private" },
      });

      expect(status).toEqual(201);
      expect(secondStatus).toEqual(201);

      expect(secretsReadData).toEqual({ secrets: { foo: "bar", foo2: "baz" } });
    });

    it("reads secrets in public mode", async () => {
      const { data } = await secretsClient.post("/");

      const { status } = await secretsClient.post(
        `/secrets`,
        {
          key: "foo",
          value: "bar",
        },
        { params: { accessKey: data.accessKey } }
      );

      const { status: secondStatus } = await secretsClient.post(
        `/secrets`,
        {
          key: "foo2",
          value: "baz",
        },
        { params: { accessKey: data.accessKey } }
      );
      const { data: secretsReadData } = await secretsClient.get(`/secrets`, {
        params: { accessKey: data.accessKey, mode: "public" },
      });

      expect(status).toEqual(201);
      expect(secondStatus).toEqual(201);

      expect(secretsReadData).toEqual({
        secrets: { foo: sha256("bar"), foo2: sha256("baz") },
      });
    });
  });

  describe("secrets through main api", () => {
    serverTestSetup();
    it("can can set secrets", async () => {
      const { api } = await buildHook();
      await api.setSecret("number", "3");
    });

    it("can read secrets with digest", async () => {
      const { api } = await buildHook();
      await api.setSecret("number", "3");
      const secrets = await api.getSecrets();
      expect(secrets).toEqual({
        number: sha256("3"),
      });
    });

    it("can delete secrets", async () => {
      const { api } = await buildHook();
      await api.setSecret("number", "3");
      await api.deleteSecret("number");
    });
  });
});
