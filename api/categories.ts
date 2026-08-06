import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendError, sendJson } from "./_lib/http.ts";
import { listClosedQuestions, listRecognitionCategories } from "./_lib/store.ts";
import type { ClosedQuestion, RecognitionCategory } from "./_lib/types.ts";

interface CategoryWithChildren extends RecognitionCategory {
    subcategories: RecognitionCategory[];
    closedQuestions: ClosedQuestion[];
}

/**
 * Requisito 2 — categorias e subcategorias configuráveis, com as questões
 * fechadas (ClosedQuestion) associadas por categoria, prontas para o
 * IconTabBar do dialog "Novo reconhecimento" (Fase 5).
 */
export default function handler(_req: VercelRequest, res: VercelResponse): void {
    try {
        const categories = listRecognitionCategories().filter((category) => category.active);
        const closedQuestions = listClosedQuestions().filter((question) => question.active);

        const topLevel = categories
            .filter((category) => category.parentCategoryId === null)
            .sort((a, b) => a.order - b.order);

        const result: CategoryWithChildren[] = topLevel.map((category) => ({
            ...category,
            subcategories: categories
                .filter((candidate) => candidate.parentCategoryId === category.id)
                .sort((a, b) => a.order - b.order),
            closedQuestions: closedQuestions
                .filter((question) => question.categoryId === category.id)
                .sort((a, b) => a.order - b.order)
        }));

        sendJson(res, 200, { categories: result });
    } catch (error) {
        sendError(res, error);
    }
}
