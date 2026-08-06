// Duplicado deliberadamente de api/_data/*.json — usado só pela
// implementação mock (DATA_SOURCE=mock), que corre inteiramente no
// browser sem rede. webapp/ não pode depender de código de api/
// (CLAUDE.md secção 10); ambos os conjuntos de seed têm de ser mantidos
// alinhados manualmente enquanto não existir um backend real.
import type { NotificationMetadata } from "../../service/types";

export const notificationMetadata: NotificationMetadata[] = [
    {
        id: "NM001",
        eventType: "RECOGNITION_RECEIVED",
        channel: "EMAIL",
        templateKey: "emailRecognitionReceived",
        subjectKey: "emailRecognitionReceivedSubject",
        recipientsRule: "RECIPIENT",
        active: true
    },
    {
        id: "NM002",
        eventType: "RECOGNITION_RECEIVED",
        channel: "TEAMS",
        templateKey: "teamsRecognitionReceived",
        subjectKey: "teamsRecognitionReceivedSubject",
        recipientsRule: "RECIPIENT",
        active: true
    },
    {
        id: "NM003",
        eventType: "RECOGNITION_SUBMITTED",
        channel: "EMAIL",
        templateKey: "emailRecognitionSubmittedConfirmation",
        subjectKey: "emailRecognitionSubmittedConfirmationSubject",
        recipientsRule: "AUTHOR",
        active: true
    }
];
