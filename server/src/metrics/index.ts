import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { metrics } from "@opentelemetry/sdk-node";
import { memoize } from "lodash";
import { resource } from "../tracing";

const meter = new metrics.MeterProvider({
  resource: resource,
  exporter: new PrometheusExporter({}, () => {
    console.log(
      `prometheus scrape endpoint: http://localhost:${PrometheusExporter.DEFAULT_OPTIONS.port}${PrometheusExporter.DEFAULT_OPTIONS.endpoint}`
    );
  }),
}).getMeter("metrics");

type CounterArgs = Parameters<typeof meter.createCounter>;

export const counter = memoize(
  (name: `wr.${string}`, options: CounterArgs[1]) => {
    return meter.createCounter(name, options);
  }
);
type UpDownCounterArgs = Parameters<typeof meter.createUpDownCounter>;

export const upDownCounter = memoize(
  (name: `wr.${string}`, options: UpDownCounterArgs[1]) => {
    return meter.createUpDownCounter(name, options);
  }
);

type HistogramArgs = Parameters<typeof meter.createHistogram>;
export const histogram = memoize(
  (name: `wr.${string}`, options: HistogramArgs[1]) => {
    return meter.createHistogram(name, options);
  }
);
