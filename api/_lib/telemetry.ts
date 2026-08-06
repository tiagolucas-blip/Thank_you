import { SpanStatusCode } from "@opentelemetry/api";
import { BasicTracerProvider, ConsoleSpanExporter, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";

const provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(new ConsoleSpanExporter())]
});
const tracer = provider.getTracer("com.xpto.thankyou.api");

/**
 * Instrumentação mínima do lado do servidor (requisito 9 — erros).
 * Mesma abordagem SDK do lado do webapp (ver
 * webapp/service/telemetry/ConsoleTelemetryService.ts) — em BTP troca-se
 * só o exporter (OTLP HTTP para o SAP Cloud Logging Service), nunca os
 * pontos de instrumentação.
 */
export function recordServerError(eventName: string, error: unknown): void {
    const span = tracer.startSpan(`error.${eventName}`);
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    span.recordException(normalizedError);
    span.setStatus({ code: SpanStatusCode.ERROR, message: normalizedError.message });
    span.end();
}
