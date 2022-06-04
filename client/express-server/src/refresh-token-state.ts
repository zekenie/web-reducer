import IORedis from "ioredis";
import { Credentials } from "./auth";
import { EventEmitter } from "events";

export const redisSubscriberConnection = new IORedis(process.env.REDIS_URL!);
export const redisPublisherConnection = new IORedis(process.env.REDIS_URL!);

export async function publishNewCreds(
  existingRefreshToken: string,
  creds: Credentials
) {
  await redisPublisherConnection.publish(
    `refreshToken.${existingRefreshToken}`,
    JSON.stringify(creds)
  );
}

const authEventEmitter = new EventEmitter();

export async function awaitNewCredsOnRefreshToken(
  outgoingToken: string
): Promise<Credentials | null> {
  return new Promise((resolve, reject) => {
    redisSubscriberConnection.subscribe(`refreshToken.${outgoingToken}`);
    const timeout = setTimeout(() => {
      redisSubscriberConnection.unsubscribe(`refreshToken.${outgoingToken}`);
      authEventEmitter.removeAllListeners(outgoingToken);
      resolve(null);
    }, 1000);
    authEventEmitter.once(outgoingToken, (creds: Credentials) => {
      clearTimeout(timeout);
      resolve(creds);
      redisSubscriberConnection.unsubscribe(`refreshToken.${outgoingToken}`);
    });
  });
}

redisSubscriberConnection.on(
  "message",
  (channel: `refreshToken.${string}`, message: Credentials) => {
    const [, refreshToken] = channel.split(".");
    authEventEmitter.emit(refreshToken, message);
  }
);
