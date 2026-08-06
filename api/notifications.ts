import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRequestUser, requireRole } from "./_lib/auth.ts";
import { sendError, sendJson } from "./_lib/http.ts";
import { listDispatchedNotifications } from "./_lib/store.ts";

/**
 * Requisitos 6 e 9 — espelha o futuro iFlow de notificações do SAP
 * Integration Suite. Nesta fase não envia nada: expõe, só a ADMIN, o
 * registo em memória dos payloads que o stub de api/_lib/notifications.ts
 * teria enviado (email/Teams), para inspeção na demo.
 */
export default function handler(req: VercelRequest, res: VercelResponse): void {
    try {
        const user = getRequestUser(req);
        requireRole(user, "ADMIN");

        sendJson(res, 200, { notifications: listDispatchedNotifications() });
    } catch (error) {
        sendError(res, error);
    }
}
