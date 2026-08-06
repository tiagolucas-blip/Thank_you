// Gera webapp/service/runtimeConfig.generated.ts a partir das variáveis de
// ambiente DATA_SOURCE, AUTH_MODE e OTEL_EXPORTER_OTLP_ENDPOINT (ver
// .env.example). É o único ponto de build onde uma variável de ambiente de
// plataforma é lida para dentro do bundle estático da SPA — necessário
// porque uma app UI5 freestyle não tem runtime de servidor para ler
// process.env por pedido. Chamado antes de "start", "build" e "test" (ver
// package.json), e uma vez no "postinstall" para que tsc/eslint funcionem
// logo após "npm install".
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const VALID_DATA_SOURCES = ["mock", "vercel-api", "odata"];
const VALID_AUTH_MODES = ["demo", "ias"];

const dataSource = VALID_DATA_SOURCES.includes(process.env.DATA_SOURCE) ? process.env.DATA_SOURCE : "mock";
const authMode = VALID_AUTH_MODES.includes(process.env.AUTH_MODE) ? process.env.AUTH_MODE : "demo";
// TELEMETRY_MODE não é uma variável independente: deriva de
// OTEL_EXPORTER_OTLP_ENDPOINT (vazio = consola, ver .env.example) para não
// duplicar a decisão de "onde exportar" em duas variáveis.
const telemetryMode = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ? "otel-collector" : "console";

const outputPath = join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "webapp",
    "service",
    "runtimeConfig.generated.ts"
);

const contents = `// Ficheiro gerado automaticamente por scripts/generate-runtime-config.mjs
// a partir das variáveis de ambiente DATA_SOURCE, AUTH_MODE e
// OTEL_EXPORTER_OTLP_ENDPOINT. Não editar à mão — as alterações são
// substituídas no próximo "npm install"/"npm start"/"npm run build"/
// "npm test".
export type DataSourceKind = "mock" | "vercel-api" | "odata";
export type AuthModeKind = "demo" | "ias";
export type TelemetryModeKind = "console" | "otel-collector";

export const DATA_SOURCE: DataSourceKind = "${dataSource}";
export const AUTH_MODE: AuthModeKind = "${authMode}";
export const TELEMETRY_MODE: TelemetryModeKind = "${telemetryMode}";
`;

writeFileSync(outputPath, contents, "utf-8");
// eslint-disable-next-line no-console -- script de build, não código da app.
console.log(
    `[generate-runtime-config] DATA_SOURCE=${dataSource} AUTH_MODE=${authMode} TELEMETRY_MODE=${telemetryMode} -> ${outputPath}`
);
