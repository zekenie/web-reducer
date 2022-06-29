import { createContext, useContext, useEffect, useState } from "react";

declare global {
  interface Window {
    ENV: {
      [key: string]: string;
    };
  }
}

function establishConnection<T>({ url }: { url: string }) {
  let lastAlive: number;
  const socket = new WebSocket(
    // `${window.ENV.AUTHENTICATED_SOCKET_URL!}?hookId=${hookId}`
    url
  );

  socket.addEventListener("open", () => (lastAlive = Date.now()));

  const heartbeat = (delay: number) => {
    lastAlive = Date.now();

    setTimeout(() => {
      if (Date.now() - lastAlive > 35_000) {
        socket.close();
      }
    }, delay);
  };

  socket.addEventListener("message", (message) => {
    heartbeat(30_000);
    if (message.data === "ping") {
      socket.send("pong");
    }
  });

  socket.addEventListener("error", (err) => {
    console.error("socket error", err);
  });

  return socket;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function setupWebsocket<T>({
  url,
  onMessage,
}: {
  url: string;
  onMessage: (payload: T) => void;
}) {
  const wrappedOnMessage = (messageEvent: MessageEvent) => {
    if (messageEvent.data === "ping") {
      return;
    }
    const payload = JSON.parse(messageEvent.data) as T;

    onMessage(payload);
  };

  let socket = establishConnection<T>({ url });

  let backoff = 200;

  socket.addEventListener("message", wrappedOnMessage);

  async function reattachOnClose(closeEvent: CloseEvent) {
    socket.removeEventListener("message", wrappedOnMessage);
    console.log("websocket closed", closeEvent.code, closeEvent.reason);
    await sleep(backoff);
    backoff *= 2;
    socket = establishConnection<T>({ url });
    socket.addEventListener("message", wrappedOnMessage);
  }

  socket.addEventListener("close", reattachOnClose);

  return {
    close() {
      console.log("close api called by react app");
      socket.removeEventListener("close", reattachOnClose);
      if (
        socket.readyState === socket.OPEN
        // socket.readyState === socket.CONNECTING
      ) {
        socket.removeEventListener("message", wrappedOnMessage);
        socket.close(1000, "close called by react app");
      } else {
        console.log(
          "did not close when close was called because socket was in readystate",
          socket.readyState
        );
      }
    },
  };
}
