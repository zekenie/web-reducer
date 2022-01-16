import jwksClient from "jwks-rsa";
import jwt from "jsonwebtoken";
import * as db from "./auth.db";

const client = jwksClient({
  jwksUri: `${process.env.AUTHN_URL}/jwks`,
  cache: true,
});

export async function getUserIdByAuthNId(authNId: string): Promise<string> {
  return db.getUserIdByAuthNId(authNId);
}

export async function validateAndDecodeJwt<T>(
  token: string
): Promise<{ isValid: boolean; payload: T }> {
  try {
    const payload = await verify(token);

    return {
      isValid: true,
      payload,
    };
  } catch (e) {
    const decodedFailedToken = jwt.decode(token);
    return { isValid: false, payload: decodedFailedToken as T };
  }
}

async function verify(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      (header, callback) => {
        client.getSigningKey(header.kid, function (err, key) {
          if (err) {
            return callback(err);
          }
          const signingKey = key.getPublicKey(); //key["publicKey"] || key["rsaPublicKey"];
          callback(null, signingKey);
        });
      },
      {},
      (err, decoded) => {
        if (err) {
          reject(err);
        }
        resolve(decoded);
      }
    );
  });
}
