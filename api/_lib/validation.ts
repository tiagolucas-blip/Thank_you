import type { RecognitionSubmission } from "./types.ts";

/**
 * `code` é o valor devolvido ao cliente (não traduzido — o webapp mapeia
 * para i18n, ver webapp/controller/NewRecognitionDialog.ts). `message`
 * é só para logs de servidor (console.error em http.ts), nunca chega ao
 * utilizador.
 */
export class ValidationError extends Error {
    public readonly field: string;
    public readonly code: string;

    constructor(field: string, code: string, message: string) {
        super(message);
        this.name = "ValidationError";
        this.field = field;
        this.code = code;
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
        throw new ValidationError(
            "recipientId",
            "selfRecognitionNotAllowed",
            "Não é possível reconhecer-se a si próprio."
        );
    }
}

export function assertValidSubmission(submission: RecognitionSubmission): void {
    if (!submission.authorId) {
        throw new ValidationError("authorId", "authorRequired", "authorId é obrigatório.");
    }
    if (!submission.recipientId) {
        throw new ValidationError("recipientId", "recipientRequired", "recipientId é obrigatório.");
    }
    assertNotSelfRecognition(submission.authorId, submission.recipientId);
    if (!submission.message || !submission.message.trim()) {
        throw new ValidationError("message", "messageRequired", "A mensagem final é obrigatória.");
    }
    if (!Array.isArray(submission.categoryRatings) || submission.categoryRatings.length === 0) {
        throw new ValidationError(
            "categoryRatings",
            "categoryRatingRequired",
            "Pelo menos uma categoria tem de ser classificada."
        );
    }
    for (const categoryRating of submission.categoryRatings) {
        if (categoryRating.rating < 1 || categoryRating.rating > 5) {
            throw new ValidationError(
                "categoryRatings",
                "categoryRatingRange",
                "A classificação por categoria tem de estar entre 1 e 5."
            );
        }
    }
}
