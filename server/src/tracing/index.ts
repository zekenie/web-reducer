import {
  context,
  defaultTextMapGetter,
  defaultTextMapSetter,
  ROOT_CONTEXT,
  trace,
} from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { ZipkinExporter } from "@opentelemetry/exporter-zipkin";
import { Resource } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

const sdk = new NodeSDK({
  // resource: new Resource
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: "backend",
  }),
  // traceExporter: new tracing.ConsoleSpanExporter(),
  traceExporter: new ZipkinExporter({
    url: process.env.ZIPKIN_URL,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

// sdk.start();

export default sdk;

export function setSpanAttribute(key: `hr.${string}`, value: string) {
  trace.getSpan(context.active())?.setAttribute(key, value);
}

export function tracingEvent(
  name: `hr.${string}`,
  value: Record<string, string>
) {
  trace.getSpan(context.active())?.addEvent(name, value);
}

export function getSpanId() {
  return trace.getSpan(context.active())?.spanContext().spanId;
}

export function serializeCurrentSpan() {
  // return trace.getSpan(context.active())?.spanContext();

  // https://github.com/open-telemetry/opentelemetry-js/issues/2458#issuecomment-913849614
  const currentSpan = trace.getSpan(context.active())!;
  const propagator = new W3CTraceContextPropagator();
  const carrier = {};
  propagator.inject(
    trace.setSpanContext(ROOT_CONTEXT, currentSpan.spanContext()),
    carrier,
    defaultTextMapSetter
  );
  return carrier;
}

export async function startActiveChildSpanFromRemoteParent(
  name: string,
  carrier: unknown,
  cb: () => void | Promise<void>
) {
  const propagator = new W3CTraceContextPropagator();
  const parentCtx = propagator.extract(
    ROOT_CONTEXT,
    carrier,
    defaultTextMapGetter
  );
  const span = trace.getTracer("backend").startSpan(name, {}, parentCtx);
  const ctx = trace.setSpan(context.active(), span);

  await context.with(ctx, cb);
  span.end();
}
