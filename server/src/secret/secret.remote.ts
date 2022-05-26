import axios from "axios";
import { SecretsError } from "./secret.error";

const client = axios.create({
  baseURL: process.env.SECRETS_URL,
  headers: { "content-type": "application/json" },
});

client.interceptors.response.use(
  (r) => {
    return r;
  },
  (err) => {
    throw new SecretsError(err.response.data);
  }
);

type NamespaceIdentifier = {
  readonly accessKey: string;
};

export async function createNamespace(): Promise<NamespaceIdentifier> {
  const { data } = await client.post<NamespaceIdentifier>("/");
  return data;
}

export async function getSecretsForNamespace({
  accessKey,
}: NamespaceIdentifier): Promise<Record<string, string>> {
  const { data } = await client.get<{ secrets: Record<string, string> }>(
    "/secrets",
    {
      params: { accessKey, mode: "public" },
    }
  );
  return data.secrets;
}

export async function _dangerouslyExposeSecretsInPlaintextForNamespace({
  accessKey,
}: NamespaceIdentifier): Promise<Record<string, string>> {
  const { data } = await client.get<{ secrets: Record<string, string> }>(
    "/secrets",
    {
      params: { accessKey, mode: "private" },
    }
  );
  return data.secrets;
}

export async function setSecret({
  accessKey,
  key,
  value,
}: {
  accessKey: string;
  key: string;
  value: string;
}): Promise<void> {
  await client.post<NamespaceIdentifier>(
    "/secrets",
    { key, value },
    { params: { accessKey } }
  );
}

export async function deleteSecret({
  accessKey,
  key,
}: {
  accessKey: string;
  key: string;
}): Promise<void> {
  await client.delete<NamespaceIdentifier>(
    "/secrets",

    { params: { accessKey, key } }
  );
}

export async function deleteNamespace({
  accessKey,
}: NamespaceIdentifier): Promise<void> {
  await client.delete<NamespaceIdentifier>(
    "/",

    { params: { accessKey } }
  );
}
