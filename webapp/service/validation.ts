/**
 * Requisito 5 — impossibilidade de auto-elogio, validada no frontend para
 * feedback imediato no dialog (Fase 5). Duplicada deliberadamente em
 * api/_lib/validation.ts: uma regra só aqui seria contornável por chamada
 * direta à API — o serviço tem de a repetir de forma independente.
 */
export function isSelfRecognition(authorId: string, recipientId: string): boolean {
    return authorId === recipientId;
}

export interface RecognitionFormValidation {
    valid: boolean;
    errors: Partial<Record<"recipientId" | "message" | "categoryRatings", string>>;
}

export function validateRecognitionForm(input: {
    authorId: string;
    recipientId: string;
    message: string;
    categoryRatings: Array<{ rating: number }>;
}): RecognitionFormValidation {
    const errors: RecognitionFormValidation["errors"] = {};

    if (!input.recipientId) {
        errors.recipientId = "recipientRequired";
    } else if (isSelfRecognition(input.authorId, input.recipientId)) {
        errors.recipientId = "selfRecognitionNotAllowed";
    }

    if (!input.message || !input.message.trim()) {
        errors.message = "messageRequired";
    }

    if (input.categoryRatings.length === 0 || input.categoryRatings.some((entry) => entry.rating < 1)) {
        errors.categoryRatings = "categoryRatingRequired";
    }

    return { valid: Object.keys(errors).length === 0, errors };
}
