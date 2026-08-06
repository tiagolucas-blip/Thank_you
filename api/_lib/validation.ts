import type { RecognitionSubmission } from "./types.ts";

export class ValidationError extends Error {
    public readonly field: string;

    constructor(field: string, message: string) {
        super(message);
        this.name = "ValidationError";
        this.field = field;
    }
}

/**
 * Requisito 5 — impossibilidade de auto-elogio. Repetida deliberadamente
 * aqui (não partilhada com webapp/service/validation.ts): uma regra só em
 * frontend é contornável por chamada direta à API, por isso o serviço tem
 * de a impor de forma independente.
 */
export function assertNotSelfRecognition(authorId: string, recipientId: string): void {
    if (authorId === recipientId) {
        throw new ValidationError("recipientId", "Não é possível reconhecer-se a si próprio.");
    }
}

export function assertValidSubmission(submission: RecognitionSubmission): void {
    if (!submission.authorId) {
        throw new ValidationError("authorId", "authorId é obrigatório.");
    }
    if (!submission.recipientId) {
        throw new ValidationError("recipientId", "recipientId é obrigatório.");
    }
    assertNotSelfRecognition(submission.authorId, submission.recipientId);
    if (!submission.message || !submission.message.trim()) {
        throw new ValidationError("message", "A mensagem final é obrigatória.");
    }
    if (!Array.isArray(submission.categoryRatings) || submission.categoryRatings.length === 0) {
        throw new ValidationError("categoryRatings", "Pelo menos uma categoria tem de ser classificada.");
    }
    for (const categoryRating of submission.categoryRatings) {
        if (categoryRating.rating < 1 || categoryRating.rating > 5) {
            throw new ValidationError("categoryRatings", "A classificação por categoria tem de estar entre 1 e 5.");
        }
    }
}
