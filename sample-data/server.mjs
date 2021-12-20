import express from "express";
import { globby } from "globby";
import fs from "fs";
import { Nilsimsa } from "nilsimsa";
import lodash from "lodash";
import cors from "cors";

const formatter = Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
});

const probabilities = {
  stdout: 0.1,
  errors: 0.05,
  noIdempotencyKey: 0.02,
};

function getSideEffects() {
  const effects = [];
  for (const key of Object.keys(probabilities)) {
    if (Math.random() < probabilities[key]) {
      effects.push(key);
    }
  }
  return effects;
}

const samplesFilenames = lodash.shuffle(await globby("**/samples/**/*.json"));

function randomDateAgo() {
  const subtractionMax = 1000 * 60 * 60 * 24 * 2;
  const toSub = Math.random() * subtractionMax;
  const d = new Date(Date.now() - toSub);
  return d;
}

const dates = Array.from({ length: samplesFilenames.length }, () =>
  randomDateAgo()
)
  .sort((a, b) => a.getTime() - b.getTime())
  .map((d) => formatter.format(d));

const processedSamples = samplesFilenames.map((filename) => {
  const body = fs.readFileSync(filename).toString();
  return {
    body,
    id: lodash.uniqueId(),
    filename: filename.split("/").join("-").split(".json").join(""),
    hash: new Nilsimsa(body).digest("hex"),
    createdAt: dates.pop(),
    effects: getSideEffects(),
  };
});

const app = express();
app.use(cors());

app.get("/", (req, res, next) => {
  res.json(processedSamples);
});

app.get("/:filename", (req, res) => {
  const file = processedSamples.find((f) => f.filename === req.params.filename);
  if (file) {
    res.json(file);
    return;
  }
  res.status(404).json({ error: { name: "not found" } });
});

app.listen(3004);
