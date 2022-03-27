import axios from "axios";

class HttpClientErr extends Error {
  originalError: Error;
  constructor(message: string) {
    super(message);
  }
}

export const unauthenticatedServerClient = axios.create({
  baseURL: process.env.SERVER_URL,
});

unauthenticatedServerClient.interceptors.response.use(
  (r) => r,
  (err) => {
    const ourErr = new HttpClientErr("server client error");
    console.error(err);
    ourErr.originalError = err;
    throw ourErr;
  }
);

export const makeAuthenticatedServerClient = ({ jwt }: { jwt: string }) => {
  const client = axios.create({
    baseURL: process.env.SERVER_URL,
    headers: {
      authorization: jwt,
    },
  });

  client.interceptors.response.use(
    (r) => r,
    (err) => {
      const ourErr = new HttpClientErr("authenticated server client error");
      console.error(err);
      ourErr.originalError = err;
      throw ourErr;
    }
  );

  return client;
};

export const runnerClient = axios.create({
  baseURL: process.env.RUNNER_URL,
});

runnerClient.interceptors.response.use(
  (r) => r,
  (err) => {
    const ourErr = new HttpClientErr("runner client error");
    ourErr.originalError = err;
    throw ourErr;
  }
);
