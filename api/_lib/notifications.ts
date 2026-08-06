import type { Employee, NotificationMetadata, RecognitionRecord } from "./types.ts";
import { findEmployeeById, listNotificationMetadata, recordDispatchedNotification } from "./store.ts";

export interface EmailPayload {
    channel: "EMAIL";
    to: string;
    subjectKey: string;
    templateKey: string;
    context: Record<string, unknown>;
}

export interface AdaptiveCardPayload {
    channel: "TEAMS";
    to: string;
    card: Record<string, unknown>;
}

export type NotificationPayload = EmailPayload | AdaptiveCardPayload;

function resolveRecipientEmployee(metadata: NotificationMetadata, record: RecognitionRecord): Employee | undefined {
    switch (metadata.recipientsRule) {
        case "RECIPIENT":
            return findEmployeeById(record.recipientId);
        case "AUTHOR":
            return findEmployeeById(record.authorId);
        case "MANAGER_OF_RECIPIENT": {
            const recipient = findEmployeeById(record.recipientId);
            return recipient?.managerId ? findEmployeeById(recipient.managerId) : undefined;
        }
        case "ADMIN":
            // Nesta fase não existe um destinatário ADMIN fixo no seed — a
            // resolução real (lista de administradores) fica para a
            // integração com o modelo de permissões do backend em BTP.
            return undefined;
        default:
            return undefined;
    }
}

function buildEmailPayload(
    metadata: NotificationMetadata,
    recipient: Employee,
    record: RecognitionRecord
): EmailPayload {
    return {
        channel: "EMAIL",
        to: recipient.email,
        subjectKey: metadata.subjectKey,
        templateKey: metadata.templateKey,
        context: {
            recipientName: recipient.name,
            recognitionId: record.id,
            isAnonymous: record.isAnonymous,
            overallRating: record.overallRating,
            message: record.message
        }
    };
}

/** Adaptive Card completo e válido (schema 1.5), gerado mas não enviado nesta fase — ver requisito 9. */
function buildTeamsAdaptiveCard(recipient: Employee, record: RecognitionRecord): AdaptiveCardPayload {
    const authorLine = record.isAnonymous ? "Um colega anónimo" : "Um colega";

    return {
        channel: "TEAMS",
        to: recipient.email,
        card: {
            type: "AdaptiveCard",
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            version: "1.5",
            body: [
                {
                    type: "TextBlock",
                    text: "Recebeste um novo reconhecimento 🎉",
                    weight: "Bolder",
                    size: "Medium",
                    wrap: true
                },
                {
                    type: "TextBlock",
                    text: `${authorLine} reconheceu o teu contributo.`,
                    wrap: true
                },
                {
                    type: "TextBlock",
                    text: record.message,
                    wrap: true,
                    isSubtle: true
                },
                {
                    type: "FactSet",
                    facts: [
                        { title: "Classificação", value: `${record.overallRating.toFixed(1)}/5` },
                        { title: "Data", value: record.createdAt }
                    ]
                }
            ],
            actions: [
                {
                    type: "Action.OpenUrl",
                    title: "Ver na plataforma Thank You",
                    url: `https://thank-you.example/#/recognitions/${record.id}`
                }
            ]
        }
    };
}

/**
 * Stub de envio (requisitos 6 e 9): em Vercel, apenas regista o payload —
 * não há SMTP nem webhook do Teams configurados nesta fase. Em BTP, este
 * ficheiro é substituído pela chamada ao iFlow de notificações do SAP
 * Integration Suite (ver docs/migracao-btp.md).
 */
export function dispatchNotificationsForEvent(eventType: string, record: RecognitionRecord): NotificationPayload[] {
    const dispatched: NotificationPayload[] = [];

    for (const metadata of listNotificationMetadata()) {
        if (metadata.eventType !== eventType || !metadata.active) {
            continue;
        }
        const recipient = resolveRecipientEmployee(metadata, record);
        if (!recipient) {
            continue;
        }

        const payload: NotificationPayload =
            metadata.channel === "EMAIL"
                ? buildEmailPayload(metadata, recipient, record)
                : buildTeamsAdaptiveCard(recipient, record);

        recordDispatchedNotification({ eventType, ...payload });
        dispatched.push(payload);
    }

    return dispatched;
}
