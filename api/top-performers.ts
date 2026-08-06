import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRequestUser } from "./_lib/auth.ts";
import { sendError, sendJson } from "./_lib/http.ts";
import { listEmployees, listRecognitionRecords } from "./_lib/store.ts";
import type { TopPerformerEntry } from "./_lib/types.ts";

/**
 * Requisitos 7 e 8 — contadores agregados públicos (visíveis a qualquer
 * colaborador autenticado) e ranking Top 5 por número de reconhecimentos,
 * com classificação média. Agregado sempre pelo destinatário — a
 * identidade de quem recebe nunca é anónima, só a de quem dá.
 */
export default function handler(req: VercelRequest, res: VercelResponse): void {
    try {
        getRequestUser(req);

        const employeesById = new Map(listEmployees().map((employee) => [employee.id, employee]));
        const records = listRecognitionRecords();

        const countByRecipient = new Map<string, number>();
        const ratingSumByRecipient = new Map<string, number>();

        for (const record of records) {
            countByRecipient.set(record.recipientId, (countByRecipient.get(record.recipientId) ?? 0) + 1);
            ratingSumByRecipient.set(
                record.recipientId,
                (ratingSumByRecipient.get(record.recipientId) ?? 0) + record.overallRating
            );
        }

        const entries: TopPerformerEntry[] = Array.from(countByRecipient.entries())
            .map(([recipientId, recognitionCount]) => {
                const employee = employeesById.get(recipientId);
                const averageRating = (ratingSumByRecipient.get(recipientId) ?? 0) / recognitionCount;
                return {
                    employee: employee
                        ? { id: employee.id, name: employee.name, photoUrl: employee.photoUrl }
                        : { id: recipientId, name: recipientId, photoUrl: "" },
                    recognitionCount,
                    averageRating: Math.round(averageRating * 10) / 10
                };
            })
            .sort((a, b) => b.recognitionCount - a.recognitionCount || b.averageRating - a.averageRating);

        const topPerformers = entries.slice(0, 5);
        const counters = Object.fromEntries(countByRecipient.entries());

        sendJson(res, 200, { topPerformers, counters });
    } catch (error) {
        sendError(res, error);
    }
}
