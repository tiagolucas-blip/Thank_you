import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRequestUser, requireRole } from "./_lib/auth.ts";
import { sendError, sendJson } from "./_lib/http.ts";
import { listEmployees, listRecognitionCategories, listRecognitionRecords } from "./_lib/store.ts";
import type { DashboardMetrics } from "./_lib/types.ts";

/**
 * Requisito 11 (e ecrã 4.3) — só ADMIN. Filtrável por ano, como no
 * mockup — filtro por período arbitrário fica assinalado como pergunta em
 * aberto em docs/analise-funcional.md.
 */
export default function handler(req: VercelRequest, res: VercelResponse): void {
    try {
        const user = getRequestUser(req);
        requireRole(user, "ADMIN");

        const year =
            typeof req.query.year === "string" ? Number.parseInt(req.query.year, 10) : new Date().getUTCFullYear();
        const records = listRecognitionRecords();
        const recordsInYear = records.filter((record) => new Date(record.createdAt).getUTCFullYear() === year);

        const totalRecognitions = recordsInYear.length;
        const averageRating =
            totalRecognitions === 0
                ? 0
                : recordsInYear.reduce((sum, record) => sum + record.overallRating, 0) / totalRecognitions;

        const activeUsers = listEmployees().filter((employee) => employee.active).length;

        const categories = listRecognitionCategories();
        const ratingSumByCategory = new Map<string, number>();
        const ratingCountByCategory = new Map<string, number>();
        for (const record of recordsInYear) {
            for (const categoryRating of record.categoryRatings) {
                ratingSumByCategory.set(
                    categoryRating.categoryId,
                    (ratingSumByCategory.get(categoryRating.categoryId) ?? 0) + categoryRating.rating
                );
                ratingCountByCategory.set(
                    categoryRating.categoryId,
                    (ratingCountByCategory.get(categoryRating.categoryId) ?? 0) + 1
                );
            }
        }
        const topCategoriesByRating = Array.from(ratingCountByCategory.entries())
            .map(([categoryId, count]) => {
                const category = categories.find((candidate) => candidate.id === categoryId);
                return {
                    categoryId,
                    labelKey: category?.labelKey ?? categoryId,
                    averageRating: Math.round(((ratingSumByCategory.get(categoryId) ?? 0) / count) * 10) / 10
                };
            })
            .sort((a, b) => b.averageRating - a.averageRating);

        const recognitionsByMonth = Array.from({ length: 12 }, (_unused, index) => ({
            month: index + 1,
            count: recordsInYear.filter((record) => new Date(record.createdAt).getUTCMonth() === index).length
        }));

        const metrics: DashboardMetrics = {
            year,
            totalRecognitions,
            averageRating: Math.round(averageRating * 10) / 10,
            averageRatingPercent: Math.round((averageRating / 5) * 1000) / 10,
            activeUsers,
            topCategoriesByRating,
            recognitionsByMonth
        };

        sendJson(res, 200, metrics);
    } catch (error) {
        sendError(res, error);
    }
}
