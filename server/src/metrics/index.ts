import { Attributes } from "@opentelemetry/api-metrics";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { metrics } from "@opentelemetry/sdk-node";
import { memoize } from "lodash";
import { resource } from "../tracing";
import * as testInternalsService from "../test-internals/test-internals.service";

const meter = new metrics.MeterProvider({
  interval: 100,
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
    const counter = meter.createCounter(name, options);
    return {
      add(value: number, attributes?: Attributes) {
        testInternalsService.add(name);
        counter.add(value, attributes);
      },
    };
  }
);
type UpDownCounterArgs = Parameters<typeof meter.createUpDownCounter>;

export const upDownCounter = memoize(
  (name: `wr.${string}`, options: UpDownCounterArgs[1]) => {
    const counter = meter.createUpDownCounter(name, options);

    return {
      add(value: number, attributes?: Attributes) {
        testInternalsService.add(name);
        counter.add(value, attributes);
      },
    };
  }
);

type HistogramArgs = Parameters<typeof meter.createHistogram>;
export const histogram = memoize(
  (name: `wr.${string}`, options: HistogramArgs[1]) => {
    const histogram = meter.createHistogram(name, options);
    histogram.record;
    return {
      record(value: number, attributes?: Attributes) {
        testInternalsService.add(name, { value });
        histogram.record(value, attributes);
      },
    };
  }
);
