import { sql } from "slonik";
import { decrypt, encrypt } from "../crypto/crypto.service";
import { getPool, transaction } from "../db";
import { getEncryptionSecretForNamespace } from "../namespace/namespace.service";
import * as db from "./secret.db";

export async function createSecret({
  accessKey,
  key,
  value,
}: {
  accessKey: string;
  key: string;
  value: string;
}) {
  const { id, secret } = await getEncryptionSecretForNamespace({ accessKey });
  const encryptedKey = encrypt(key, secret);
  const encryptedValue = encrypt(value, secret);

  const rawSecretsForNamespace = await db.getSecretsForNamespace({
    namespaceId: id,
  });
  const secretToDelete = rawSecretsForNamespace.find(
    (rawSecretRecord) => decrypt(rawSecretRecord.encryptedKey, secret) === key
  );

  await transaction(async () => {
    if (secretToDelete) {
      await db.deleteExistingKey({
        namespaceId: id,
        secretId: secretToDelete.id,
      });
    }
    await db.saveSecret({ namespaceId: id, encryptedKey, encryptedValue });
  });
}

export async function deleteSecret({
  accessKey,
  key,
}: {
  accessKey: string;
  key: string;
}) {
  const { id, secret } = await getEncryptionSecretForNamespace({ accessKey });
  const rawSecretsForNamespace = await db.getSecretsForNamespace({
    namespaceId: id,
  });
  const secretToDelete = rawSecretsForNamespace.find(
    (rawSecretRecord) => decrypt(rawSecretRecord.encryptedKey, secret) === key
  );
  if (!secretToDelete) {
    return;
  }

  const deletedCount = await db.deleteExistingKey({
    namespaceId: id,
    secretId: secretToDelete.id,
  });
}
