import type ITelemetryService from "./telemetry/ITelemetryService";
import ConsoleTelemetryService from "./telemetry/ConsoleTelemetryService";
import OtelCollectorTelemetryService from "./telemetry/OtelCollectorTelemetryService";
import { TELEMETRY_MODE } from "./runtimeConfig.generated";

let instance: ITelemetryService | undefined;

/**
 * Único ponto de seleção da implementação de telemetria, por
 * TELEMETRY_MODE. Nenhum controller deve instanciar ConsoleTelemetryService/
 * OtelCollectorTelemetryService diretamente — ver CLAUDE.md secção 6.
 */
export function getTelemetryService(): ITelemetryService {
    if (!instance) {
        instance =
            TELEMETRY_MODE === "otel-collector" ? new OtelCollectorTelemetryService() : new ConsoleTelemetryService();
    }
    return instance;
}
