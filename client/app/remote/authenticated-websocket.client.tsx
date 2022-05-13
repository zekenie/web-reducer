declare global {
  interface Window {
    ENV: {
      [key: string]: string;
    };
  }
}

function establishConnection<T>({
  hookId,
  onMessage,
}: {
  hookId: string;
  onMessage: (payload: T) => void;
}) {
  const socket = new WebSocket(
    `${window.ENV.AUTHENTICATED_SOCKET_URL!}?hookId=${hookId}`
  );

  socket.addEventListener("error", (err) => {
    socket.close();
  });

  socket.addEventListener("message", (stateHistory) => {
    const payload = JSON.parse(stateHistory.data) as T;

    onMessage(payload);
  });

  return socket;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function setupWebsocket<T>({
  hookId,
  onMessage,
}: {
  hookId: string;
  onMessage: (payload: T) => void;
}) {
  let socket = establishConnection<T>({ hookId, onMessage });

  let backoff = 200;

  async function reattachOnClose() {
    await sleep(backoff);
    backoff *= 2;
    socket = establishConnection<T>({ hookId, onMessage });
  }

  socket.addEventListener("close", reattachOnClose);

  return {
    close() {
      socket.removeEventListener("close", reattachOnClose);
      socket.close();
    },
  };
}
