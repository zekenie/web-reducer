import { decrypt, encrypt, sha256 } from "../crypto/crypto.service";
import { generateToken } from "../token/token.service";
import * as db from "./namespace.db";
import * as secretsDb from "../secret/secret.db";
import { NamespaceNotFoundError } from "./namespace.errors";
import { mapValues } from "lodash";

export async function createNamespace(): Promise<NamespaceCreatedContract> {
  const accessKey = await generateToken();
  const encryptionSecret = await generateToken();
  const encryptedSecret = encrypt(
    encryptionSecret,
    process.env.ENCRYPTION_SECRET!
  );
  const namespaceId = await db.createNamespace({ encryptedSecret, accessKey });
  return { id: namespaceId, accessKey };
}

export async function deleteNamespace({
  accessKey,
}: {
  accessKey: string;
}): Promise<void> {
  await db.deleteNamespace({ accessKey });
}

export async function getEncryptionSecretForNamespace({
  accessKey,
}: {
  accessKey: string;
}) {
  try {
    const { encryptedSecret, id } = await db.getEncryptedSecretForNamespace({
      accessKey,
    });
    const decryptedSecret = decrypt(
      encryptedSecret,
      process.env.ENCRYPTION_SECRET!
    );
    return { secret: decryptedSecret, id };
  } catch (e) {
    throw new NamespaceNotFoundError();
  }
}

export async function getSecretsForNamespace({
  accessKey,
  mode,
}: {
  accessKey: string;
  mode: "public" | "private";
}) {
  const { id, secret } = await getEncryptionSecretForNamespace({ accessKey });
  const secrets = await secretsDb.getSecretsForNamespace({ namespaceId: id });

  const secretsObj = secrets
    .map((s) => ({
      key: decrypt(s.encryptedKey, secret),
      value: decrypt(s.encryptedValue, secret),
    }))
    .reduce((acc, obj) => {
      return { ...acc, [obj.key]: obj.value };
    }, {});

  switch (mode) {
    case "private":
      return secretsObj;
    case "public":
      return mapValues(secretsObj, sha256);
  }
}
