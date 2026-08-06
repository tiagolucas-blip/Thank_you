// Gera webapp/service/runtimeConfig.generated.ts a partir das variáveis de
// ambiente DATA_SOURCE e AUTH_MODE (ver .env.example). É o único ponto de
// build onde uma variável de ambiente de plataforma é lida para dentro do
// bundle estático da SPA — necessário porque uma app UI5 freestyle não tem
// runtime de servidor para ler process.env por pedido. Chamado antes de
// "start", "build" e "test" (ver package.json), e uma vez no "postinstall"
// para que tsc/eslint funcionem logo após "npm install".
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const VALID_DATA_SOURCES = ["mock", "vercel-api", "odata"];
const VALID_AUTH_MODES = ["demo", "ias"];

const dataSource = VALID_DATA_SOURCES.includes(process.env.DATA_SOURCE) ? process.env.DATA_SOURCE : "mock";
const authMode = VALID_AUTH_MODES.includes(process.env.AUTH_MODE) ? process.env.AUTH_MODE : "demo";

const outputPath = join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "webapp",
    "service",
    "runtimeConfig.generated.ts"
);

const contents = `// Ficheiro gerado automaticamente por scripts/generate-runtime-config.mjs
// a partir das variáveis de ambiente DATA_SOURCE e AUTH_MODE. Não editar à
// mão — as alterações são substituídas no próximo "npm install"/"npm start"/
// "npm run build"/"npm test".
export type DataSourceKind = "mock" | "vercel-api" | "odata";
export type AuthModeKind = "demo" | "ias";

export const DATA_SOURCE: DataSourceKind = "${dataSource}";
export const AUTH_MODE: AuthModeKind = "${authMode}";
`;

writeFileSync(outputPath, contents, "utf-8");
// eslint-disable-next-line no-console -- script de build, não código da app.
console.log(`[generate-runtime-config] DATA_SOURCE=${dataSource} AUTH_MODE=${authMode} -> ${outputPath}`);
