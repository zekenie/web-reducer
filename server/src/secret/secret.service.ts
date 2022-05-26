import { decrypt } from "../crypto/crypto.service";
import { getEncryptedSecretAccessKey } from "../hook/hook.db";

export async function getAccessKeyForHook({
  hookId,
}: {
  hookId: string;
}): Promise<string> {
  const encryptedSecret = await getEncryptedSecretAccessKey({ hookId });
  return decrypt(encryptedSecret, process.env.SECRET_ACCESS_KEY_KEY!);
}
