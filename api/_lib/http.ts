import type { VercelResponse } from "@vercel/node";
import { AuthorizationError } from "./auth.ts";
import { ValidationError } from "./validation.ts";

export function sendJson(res: VercelResponse, status: number, body: unknown): void {
    res.status(status).json(body);
}

export function sendError(res: VercelResponse, error: unknown): void {
    if (error instanceof ValidationError) {
        sendJson(res, 400, { error: error.message, field: error.field });
        return;
    }
    if (error instanceof AuthorizationError) {
        sendJson(res, 403, { error: error.message });
        return;
    }
    // eslint-disable-next-line no-console -- erro inesperado, tratamento central (secção 12).
    console.error(error);
    sendJson(res, 500, { error: "Erro interno inesperado." });
}
