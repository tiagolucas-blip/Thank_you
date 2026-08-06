import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRequestUser, requireRole } from "./_lib/auth.ts";
import { sendError, sendJson } from "./_lib/http.ts";
import { toRecognitionRecordView } from "./_lib/anonymize.ts";
import { dispatchNotificationsForEvent } from "./_lib/notifications.ts";
import { addRecognitionRecord, listEmployees, listRecognitionRecords } from "./_lib/store.ts";
import type { RecognitionRecord, RecognitionSubmission } from "./_lib/types.ts";
import { assertValidSubmission, ValidationError } from "./_lib/validation.ts";

/**
 * Requisitos 1, 4, 5, 6, 7, 12 — leitura (recebidos/atribuídos, com
 * anonimização aplicada no serviço) e submissão de reconhecimentos (com a
 * regra de auto-elogio validada aqui, independentemente do frontend).
 */
export default function handler(req: VercelRequest, res: VercelResponse): void {
    if (req.method === "POST") {
        handlePost(req, res);
        return;
    }
    handleGet(req, res);
}

function handleGet(req: VercelRequest, res: VercelResponse): void {
    try {
        const user = getRequestUser(req);
        const direction =
            req.query.direction === "given" ? "given" : req.query.direction === "all" ? "all" : "received";
        const search = typeof req.query.search === "string" ? req.query.search.trim().toLowerCase() : "";
        const employeesById = new Map(listEmployees().map((employee) => [employee.id, employee]));

        if (direction === "all") {
            requireRole(user, "ADMIN");
            const views = listRecognitionRecords()
                .map((record) => toRecognitionRecordView(record, employeesById))
                .filter((view) => !search || (view.author?.name ?? "").toLowerCase().includes(search))
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .slice(0, 30);
            sendJson(res, 200, { recognitions: views });
            return;
        }

        const employeeId = typeof req.query.employeeId === "string" ? req.query.employeeId : user.employeeId;
        if (employeeId !== user.employeeId) {
            requireRole(user, "ADMIN");
        }

        const records = listRecognitionRecords().filter((record) =>
            direction === "received" ? record.recipientId === employeeId : record.authorId === employeeId
        );

        const views = records
            .map((record) => toRecognitionRecordView(record, employeesById))
            .filter((view) => {
                if (!search) {
                    return true;
                }
                const counterpartName =
                    direction === "received"
                        ? (view.author?.name ?? "")
                        : (employeesById.get(view.recipientId)?.name ?? "");
                return counterpartName.toLowerCase().includes(search) || view.message.toLowerCase().includes(search);
            })
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

        sendJson(res, 200, { recognitions: views });
    } catch (error) {
        sendError(res, error);
    }
}

function handlePost(req: VercelRequest, res: VercelResponse): void {
    try {
        const user = getRequestUser(req);
        const body = req.body as Partial<RecognitionSubmission>;

        if (typeof body.recipientId !== "string") {
            throw new ValidationError("recipientId", "recipientId é obrigatório.");
        }

        const submission: RecognitionSubmission = {
            authorId: user.employeeId,
            recipientId: body.recipientId,
            isAnonymous: Boolean(body.isAnonymous),
            message: typeof body.message === "string" ? body.message : "",
            categoryRatings: Array.isArray(body.categoryRatings) ? body.categoryRatings : [],
            closedAnswers: Array.isArray(body.closedAnswers) ? body.closedAnswers : []
        };

        assertValidSubmission(submission);

        const overallRating =
            submission.categoryRatings.reduce((sum, entry) => sum + entry.rating, 0) /
            submission.categoryRatings.length;

        const record: RecognitionRecord = {
            id: `REC${Date.now()}`,
            authorId: submission.authorId,
            recipientId: submission.recipientId,
            isAnonymous: submission.isAnonymous,
            message: submission.message,
            categoryRatings: submission.categoryRatings,
            closedAnswers: submission.closedAnswers,
            overallRating: Math.round(overallRating * 10) / 10,
            createdAt: new Date().toISOString(),
            status: "SUBMITTED"
        };

        addRecognitionRecord(record);
        dispatchNotificationsForEvent("RECOGNITION_RECEIVED", record);
        dispatchNotificationsForEvent("RECOGNITION_SUBMITTED", record);

        sendJson(res, 201, {
            id: record.id,
            createdAt: record.createdAt,
            overallRating: record.overallRating,
            isAnonymous: record.isAnonymous
        });
    } catch (error) {
        sendError(res, error);
    }
}
