import type { CategoryRating, ClosedAnswer } from "../types";

/**
 * Forma de armazenamento interna do mock (nunca exposta diretamente ao
 * cliente) — equivalente a RecognitionRecord em api/_lib/types.ts.
 * authorId persiste sempre aqui; a anonimização acontece só na
 * conversão para RecognitionRecordView (ver ../anonymize.ts).
 */
export interface StoredRecognitionRecord {
    id: string;
    authorId: string;
    recipientId: string;
    isAnonymous: boolean;
    message: string;
    categoryRatings: CategoryRating[];
    closedAnswers: ClosedAnswer[];
    overallRating: number;
    createdAt: string;
    status: string;
}
