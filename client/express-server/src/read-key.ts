import type { RequestHandler } from "express";
import { readFileSync } from "fs";
import * as eta from "eta";
import { memoize } from "lodash";

const rawReadTemplate = () => {
  return readFileSync("./read-key-template.html").toString();
};

const getReadKeyTemplate =
  process.env.NODE_ENV === "development"
    ? rawReadTemplate
    : memoize(rawReadTemplate);

async function fetchState(readKey: string) {
  const res = await fetch(`${process.env.BACKEND_URL}/${readKey}`, {
    method: "GET",
    headers: {
      Accepts: "application/json",
      "Content-Type": "application/json",
    },
  });

  return res.json();
}

export const readKeyHandler: RequestHandler = async (req, res, next) => {
  try {
    const state = await fetchState(req.params.readKey);

    res.format({
      json: () => res.send(state),
      html: async () => {
        const renderedHtml = await eta.render(getReadKeyTemplate(), {
          readKey: req.params.readKey,
          socketUrl: `ws://localhost:3000/state-events?readKey=${req.params.readKey}`,
          state,
        });
        res.send(renderedHtml);
      },
    });
  } catch (e) {
    next(e);
  }
};
