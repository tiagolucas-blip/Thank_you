import type { Employee, RecognitionAuthorView, RecognitionRecord, RecognitionRecordView } from "./types.ts";

/**
 * Requisito 4 — anonimização. authorId persiste sempre em RecognitionRecord
 * (nunca é apagado do armazenamento); esta função é o único ponto onde a
 * serialização para o cliente decide omiti-lo. Nunca deve ser a view a
 * decidir isto — ver docs/modelo-dados.md secção 3.
 */
export function toRecognitionRecordView(
    record: RecognitionRecord,
    employeesById: Map<string, Employee>
): RecognitionRecordView {
    const author = record.isAnonymous ? null : toAuthorView(employeesById.get(record.authorId));

    return {
        id: record.id,
        author,
        isAnonymous: record.isAnonymous,
        recipientId: record.recipientId,
        message: record.message,
        categoryRatings: record.categoryRatings,
        closedAnswers: record.closedAnswers,
        overallRating: record.overallRating,
        createdAt: record.createdAt,
        status: record.status
    };
}

function toAuthorView(employee: Employee | undefined): RecognitionAuthorView | null {
    if (!employee) {
        return null;
    }
    return {
        id: employee.id,
        name: employee.name,
        photoUrl: employee.photoUrl
    };
}
