import type { RequestHandler } from "express";
import { readFileSync } from "fs";
import * as eta from "eta";
import { memoize } from "lodash";
import { join } from "path";

const rawReadTemplate = () => {
  return readFileSync(
    join(__dirname, "..", "read-key-template.html")
  ).toString();
};

const getReadKeyTemplate =
  process.env.NODE_ENV === "development"
    ? rawReadTemplate
    : memoize(rawReadTemplate);

async function fetchState(readKey: string, queryString: string = "") {
  const res = await fetch(
    `${process.env.BACKEND_URL}/read/${readKey}${queryString}`,
    {
      method: "GET",
      headers: {
        Accepts: "application/json",
        "Content-Type": "application/json",
      },
    }
  );

  return res.json();
}

export const readKeyHandler: RequestHandler = async (req, res, next) => {
  try {
    const originalUrl = `${req.protocol}://${req.hostname}${req.originalUrl}`;
    const urlObj = new URL(originalUrl);

    const state = await fetchState(req.params.readKey, urlObj.search);

    res.format({
      json: () => res.send(state),
      html: async () => {
        const renderedHtml = await eta.render(getReadKeyTemplate(), {
          readKey: req.params.readKey,
          socketUrl: `${process.env.UNAUTHENTICATED_SOCKET_URL}?readKey=${req.params.readKey}`,
          state,
        });
        res.send(renderedHtml);
      },
    });
  } catch (e) {
    next(e);
  }
};
