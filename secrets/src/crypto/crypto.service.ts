import crypto from "crypto";

const algo = "aes256";

export function encrypt(str: string, secret: string) {
  const secretBuffer = crypto.createHash("sha256").update(secret).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algo, secretBuffer, iv);

  let encrypted = cipher.update(str, "binary", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + encrypted;

  // return { encrypted, iv };
}

export function decrypt(encryptedWithIv: string, secret: string): string {
  const iv = encryptedWithIv.slice(0, 32);
  const encrypted = encryptedWithIv.slice(32);
  const secretBuffer = crypto.createHash("sha256").update(secret).digest();
  const d = crypto.createDecipheriv(algo, secretBuffer, Buffer.from(iv, "hex"));
  let encText = d.update(encrypted, "hex", "binary");
  encText += d.final("binary");
  return encText;
}
