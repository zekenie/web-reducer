import axios from "axios";

class HttpClientErr extends Error {
  originalError: Error;
  constructor(message: string) {
    super(message);
  }
}

export const serverClient = axios.create({
  baseURL: process.env.SERVER_URL,
});

serverClient.interceptors.response.use(
  (r) => r,
  (err) => {
    const ourErr = new HttpClientErr("server client error");
    console.error(err);
    ourErr.originalError = err;
    throw ourErr;
  }
);

export const runnerClient = axios.create({
  baseURL: process.env.RUNNER_URL,
});

runnerClient.interceptors.response.use(
  (r) => r,
  (err) => {
    const ourErr = new HttpClientErr("server client error");
    ourErr.originalError = err;
    throw ourErr;
  }
);
