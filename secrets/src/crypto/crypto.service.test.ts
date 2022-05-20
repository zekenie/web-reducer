import crypto, { randomUUID } from "crypto";
import * as cryptoService from "./crypto.service";
describe("crypto", () => {
  it("encrypts and decrypts", () => {
    const secret = randomUUID();
    const encryptedWithIv = cryptoService.encrypt("shh hide this", secret);
    const answer = cryptoService.decrypt(encryptedWithIv, secret);

    expect(answer).toEqual("shh hide this");
  });
});
