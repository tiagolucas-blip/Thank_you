// Ficheiro gerado automaticamente por scripts/generate-runtime-config.mjs
// a partir das variáveis de ambiente DATA_SOURCE, AUTH_MODE e
// OTEL_EXPORTER_OTLP_ENDPOINT. Não editar à mão — as alterações são
// substituídas no próximo "npm install"/"npm start"/"npm run build"/
// "npm test".
export type DataSourceKind = "mock" | "vercel-api" | "odata";
export type AuthModeKind = "demo" | "ias";
export type TelemetryModeKind = "console" | "otel-collector";

export const DATA_SOURCE: DataSourceKind = "mock";
export const AUTH_MODE: AuthModeKind = "demo";
export const TELEMETRY_MODE: TelemetryModeKind = "console";
