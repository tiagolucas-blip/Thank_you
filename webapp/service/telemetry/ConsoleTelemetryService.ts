import type ITelemetryService from "./ITelemetryService";
import type { TelemetryAttributes } from "./ITelemetryService";

type SpanStatus = "OK" | "ERROR";

interface SpanRecord {
    name: string;
    timestamp: string;
    attributes: TelemetryAttributes;
    status: SpanStatus;
    statusMessage?: string;
}

/**
 * Implementação TELEMETRY_MODE=console (default em Vercel).
 *
 * Não usa o SDK @opentelemetry/* aqui de propósito: esses pacotes
 * distribuem-se como módulos CommonJS/ESM para bundlers (webpack/esbuild),
 * e esta app é UI5 Freestyle clássica — o carregador AMD do UI5
 * (sap.ui.define, ver ui5-tooling-transpile) não resolve pacotes npm
 * arbitrários em runtime. Confirmado nesta fase: importar
 * "@opentelemetry/api" diretamente aqui partia a app inteira com
 * "ModuleError: Failed to resolve dependencies" (404 a pedir
 * resources/@opentelemetry/api.js, que não existe). Por isso esta
 * implementação regista spans no mesmo formato semântico do OTel — nome,
 * atributos, estado — sem a dependência, mantendo o contrato
 * ITelemetryService idêntico ao das outras camadas.
 *
 * O lado do servidor (api/_lib/telemetry.ts) não tem esta limitação:
 * Vercel Functions correm em Node puro, fora do carregador UI5, e usam lá
 * o SDK OpenTelemetry real (@opentelemetry/api + sdk-trace-base). Na
 * migração para BTP, este lado browser passa a usar
 * @opentelemetry/sdk-trace-web com um exporter OTLP através de um bundle
 * próprio para o browser — ver docs/migracao-btp.md; o contrato
 * ITelemetryService e os pontos de instrumentação nos controllers não
 * mudam.
 */
export default class ConsoleTelemetryService implements ITelemetryService {
    public recordPageView(pageName: string, attributes: TelemetryAttributes = {}): void {
        this.emit(`pageview.${pageName}`, attributes, "OK");
    }

    public recordEvent(eventName: string, attributes: TelemetryAttributes = {}): void {
        this.emit(`event.${eventName}`, attributes, "OK");
    }

    public recordError(eventName: string, error: unknown, attributes: TelemetryAttributes = {}): void {
        const statusMessage = error instanceof Error ? error.message : String(error);
        this.emit(`error.${eventName}`, attributes, "ERROR", statusMessage);
    }

    private emit(name: string, attributes: TelemetryAttributes, status: SpanStatus, statusMessage?: string): void {
        const record: SpanRecord = { name, timestamp: new Date().toISOString(), attributes, status, statusMessage };
        // eslint-disable-next-line no-console -- exporter de telemetria (TELEMETRY_MODE=console), ver docs/analise-funcional.md.
        console.info("[otel-span]", record);
    }
}
