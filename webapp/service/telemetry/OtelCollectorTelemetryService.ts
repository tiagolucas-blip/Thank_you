import type ITelemetryService from "./ITelemetryService";
import type { TelemetryAttributes } from "./ITelemetryService";

/**
 * Esqueleto BTP (TELEMETRY_MODE=otel-collector, ativado quando
 * OTEL_EXPORTER_OTLP_ENDPOINT está definido no build — ver
 * scripts/generate-runtime-config.mjs). Vai usar
 * @opentelemetry/sdk-trace-web + um OTLPTraceExporter
 * (@opentelemetry/exporter-trace-otlp-http) apontado ao SAP Cloud Logging
 * Service. Ao contrário de ConsoleTelemetryService.ts (sem dependências —
 * ver o comentário lá sobre o carregador AMD do UI5 não resolver pacotes
 * npm em runtime), esta implementação só é viável com um bundle próprio
 * para o browser (webpack/esbuild), fora do pipeline `ui5 build` desta
 * fase. Por implementar — ver docs/migracao-btp.md.
 */
export default class OtelCollectorTelemetryService implements ITelemetryService {
    public recordPageView(_pageName: string, _attributes?: TelemetryAttributes): void {
        throw new Error("OtelCollectorTelemetryService.recordPageView: por implementar na migração para SAP BTP.");
    }

    public recordEvent(_eventName: string, _attributes?: TelemetryAttributes): void {
        throw new Error("OtelCollectorTelemetryService.recordEvent: por implementar na migração para SAP BTP.");
    }

    public recordError(_eventName: string, _error: unknown, _attributes?: TelemetryAttributes): void {
        throw new Error("OtelCollectorTelemetryService.recordError: por implementar na migração para SAP BTP.");
    }
}
