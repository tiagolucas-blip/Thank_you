export interface TelemetryAttributes {
    [key: string]: string | number | boolean;
}

/**
 * Interface única de telemetria (requisito 11 — relatórios de
 * utilização/engagement baseados em OpenTelemetry, ver
 * docs/analise-funcional.md). Instrumenta eventos de negócio — vista de
 * página, pesquisa de colaborador, submissão de reconhecimento, erros —
 * não infraestrutura de baixo nível. Nenhum controller deve chamar
 * @opentelemetry/api diretamente (CLAUDE.md secção 6): só as
 * implementações desta pasta o fazem.
 */
export default interface ITelemetryService {
    recordPageView(pageName: string, attributes?: TelemetryAttributes): void;
    recordEvent(eventName: string, attributes?: TelemetryAttributes): void;
    recordError(eventName: string, error: unknown, attributes?: TelemetryAttributes): void;
}
