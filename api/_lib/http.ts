import type { VercelResponse } from "@vercel/node";
import { AuthorizationError } from "./auth.ts";
import { ValidationError } from "./validation.ts";
import { recordServerError } from "./telemetry.ts";

export function sendJson(res: VercelResponse, status: number, body: unknown): void {
    res.status(status).json(body);
}

/**
 * O corpo JSON devolve sempre `error` como código estável (não traduzido —
 * o webapp mapeia para i18n). `error.message` (PT, legível) só vai para
 * os logs de servidor, nunca para o cliente.
 */
export function sendError(res: VercelResponse, error: unknown): void {
    if (error instanceof ValidationError) {
        sendJson(res, 400, { error: error.code, field: error.field });
        return;
    }
    if (error instanceof AuthorizationError) {
        sendJson(res, 403, { error: error.code });
        return;
    }
    // eslint-disable-next-line no-console -- erro inesperado, tratamento central (secção 12).
    console.error(error);
    recordServerError("api_internal_error", error);
    sendJson(res, 500, { error: "internalError" });
}
