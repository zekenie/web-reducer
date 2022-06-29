import { decrypt, encrypt, sha256 } from "../crypto/crypto.service";
import { bulkGenerateTokens, generateToken } from "../token/token.service";
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
  const namespaceId = await db.insertNamespace({ encryptedSecret, accessKey });
  return { id: namespaceId, accessKey };
}

export async function bulkCreateNamespace(n: number): Promise<string[]> {
  if (n > 500) {
    throw new RangeError("cannot bulk create more than 500 namespaces");
  }
  const tokensNeeded = await bulkGenerateTokens(n * 2);

  const encryptedSecrets = tokensNeeded
    .slice(0, n)
    .map((s) => encrypt(s, process.env.ENCRYPTION_SECRET!));
  const accessKeys = tokensNeeded.slice(n);

  const hashedAccessKeys = accessKeys.map(sha256);

  const toInsert = Array.from({ length: n })
    .fill(null)
    .map((n, i) => {
      return {
        encryptedSecret: encryptedSecrets[i],
        accessKey: hashedAccessKeys[i],
      };
    });

  await db.bulkInsertNamespace(toInsert);

  return accessKeys;
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
