import type IRecognitionService from "../IRecognitionService";
import type {
    DashboardMetrics,
    Employee,
    RecognitionCategory,
    RecognitionRecordView,
    RecognitionSubmission,
    RecognitionSubmissionResult,
    TopPerformerEntry
} from "../types";
import { getAuthService } from "../AuthServiceFactory";
import { toAuthorView } from "../anonymize";
import { isSelfRecognition } from "../validation";
import { employees } from "../../localService/mockdata/employees";
import { employeeExclusions } from "../../localService/mockdata/employeeExclusions";
import { recognitionCategoriesFlat } from "../../localService/mockdata/recognitionCategories";
import { closedQuestions } from "../../localService/mockdata/closedQuestions";
import { recognitionRecords as seedRecognitionRecords } from "../../localService/mockdata/recognitionRecords";
import type { StoredRecognitionRecord } from "./types";

const employeesById = new Map<string, Employee>(employees.map((employee) => [employee.id, employee]));
const activeExclusionIds = new Set(
    employeeExclusions.filter((exclusion) => exclusion.active).map((exclusion) => exclusion.employeeId)
);

/** Estado em memória — reinicia a cada reload da página, tal como a implementação vercel-api reinicia a cada cold start. */
const records: StoredRecognitionRecord[] = [...seedRecognitionRecords];

function toView(record: StoredRecognitionRecord): RecognitionRecordView {
    return {
        id: record.id,
        author: toAuthorView(employeesById.get(record.authorId), record.isAnonymous),
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

/**
 * Implementação DATA_SOURCE=mock: dados de seed locais, sem rede — usada
 * em desenvolvimento offline e nos testes de unidade (esta ficha cobre os
 * testes obrigatórios da regra de auto-elogio e de anonimização, ver
 * webapp/test/unit/service/).
 */
export default class MockRecognitionService implements IRecognitionService {
    public async searchEmployees(params: { search?: string; orgArea?: string }): Promise<Employee[]> {
        const currentUser = await getAuthService().getCurrentUser();
        const search = params.search?.trim().toLowerCase() ?? "";

        return employees.filter((employee) => {
            if (employee.id === currentUser.employee.id) {
                return false;
            }
            if (!employee.active || activeExclusionIds.has(employee.id)) {
                return false;
            }
            if (params.orgArea && employee.orgArea !== params.orgArea) {
                return false;
            }
            if (search && !employee.name.toLowerCase().includes(search)) {
                return false;
            }
            return true;
        });
    }

    public async getCategories(): Promise<RecognitionCategory[]> {
        const topLevel = recognitionCategoriesFlat
            .filter((category) => category.active && category.parentCategoryId === null)
            .sort((a, b) => a.order - b.order);

        return topLevel.map((category) => ({
            ...category,
            subcategories: recognitionCategoriesFlat
                .filter((candidate) => candidate.active && candidate.parentCategoryId === category.id)
                .sort((a, b) => a.order - b.order),
            closedQuestions: closedQuestions
                .filter((question) => question.active && question.categoryId === category.id)
                .sort((a, b) => a.order - b.order)
        }));
    }

    public async getReceivedRecognitions(employeeId: string, search?: string): Promise<RecognitionRecordView[]> {
        return this.filterAndView(
            records.filter((record) => record.recipientId === employeeId),
            search,
            "received"
        );
    }

    public async getGivenRecognitions(employeeId: string, search?: string): Promise<RecognitionRecordView[]> {
        return this.filterAndView(
            records.filter((record) => record.authorId === employeeId),
            search,
            "given"
        );
    }

    public async submitRecognition(submission: RecognitionSubmission): Promise<RecognitionSubmissionResult> {
        const currentUser = await getAuthService().getCurrentUser();

        if (isSelfRecognition(currentUser.employee.id, submission.recipientId)) {
            throw new Error("Não é possível reconhecer-se a si próprio.");
        }
        if (!submission.categoryRatings.length) {
            throw new Error("Pelo menos uma categoria tem de ser classificada.");
        }

        const overallRating =
            submission.categoryRatings.reduce((sum, entry) => sum + entry.rating, 0) /
            submission.categoryRatings.length;

        const record: StoredRecognitionRecord = {
            id: `REC${Date.now()}`,
            authorId: currentUser.employee.id,
            recipientId: submission.recipientId,
            isAnonymous: submission.isAnonymous,
            message: submission.message,
            categoryRatings: submission.categoryRatings,
            closedAnswers: submission.closedAnswers,
            overallRating: Math.round(overallRating * 10) / 10,
            createdAt: new Date().toISOString(),
            status: "SUBMITTED"
        };

        records.push(record);

        return {
            id: record.id,
            createdAt: record.createdAt,
            overallRating: record.overallRating,
            isAnonymous: record.isAnonymous
        };
    }

    public async getTopPerformers(): Promise<TopPerformerEntry[]> {
        const entries = this.aggregateByRecipient();
        return entries.slice(0, 5);
    }

    public async getPublicCounters(): Promise<Record<string, number>> {
        const counters: Record<string, number> = {};
        for (const record of records) {
            counters[record.recipientId] = (counters[record.recipientId] ?? 0) + 1;
        }
        return counters;
    }

    public async getDashboardMetrics(year: number): Promise<DashboardMetrics> {
        const currentUser = await getAuthService().getCurrentUser();
        if (currentUser.role !== "ADMIN") {
            throw new Error("Esta operação requer o papel ADMIN.");
        }

        const recordsInYear = records.filter((record) => new Date(record.createdAt).getUTCFullYear() === year);
        const totalRecognitions = recordsInYear.length;
        const averageRating =
            totalRecognitions === 0
                ? 0
                : recordsInYear.reduce((sum, record) => sum + record.overallRating, 0) / totalRecognitions;

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
                const category = recognitionCategoriesFlat.find((candidate) => candidate.id === categoryId);
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

        return {
            year,
            totalRecognitions,
            averageRating: Math.round(averageRating * 10) / 10,
            averageRatingPercent: Math.round((averageRating / 5) * 1000) / 10,
            activeUsers: employees.filter((employee) => employee.active).length,
            topCategoriesByRating,
            recognitionsByMonth
        };
    }

    private aggregateByRecipient(): TopPerformerEntry[] {
        const countByRecipient = new Map<string, number>();
        const ratingSumByRecipient = new Map<string, number>();

        for (const record of records) {
            countByRecipient.set(record.recipientId, (countByRecipient.get(record.recipientId) ?? 0) + 1);
            ratingSumByRecipient.set(
                record.recipientId,
                (ratingSumByRecipient.get(record.recipientId) ?? 0) + record.overallRating
            );
        }

        return Array.from(countByRecipient.entries())
            .map(([recipientId, recognitionCount]) => {
                const employee = employeesById.get(recipientId);
                const averageRating = (ratingSumByRecipient.get(recipientId) ?? 0) / recognitionCount;
                return {
                    employee: employee
                        ? { id: employee.id, name: employee.name, photoUrl: employee.photoUrl }
                        : { id: recipientId, name: recipientId, photoUrl: "" },
                    recognitionCount,
                    averageRating: Math.round(averageRating * 10) / 10
                };
            })
            .sort((a, b) => b.recognitionCount - a.recognitionCount || b.averageRating - a.averageRating);
    }

    private filterAndView(
        list: StoredRecognitionRecord[],
        search: string | undefined,
        direction: "received" | "given"
    ): RecognitionRecordView[] {
        const term = search?.trim().toLowerCase() ?? "";

        return list
            .map((record) => toView(record))
            .filter((view) => {
                if (!term) {
                    return true;
                }
                const counterpartName =
                    direction === "received"
                        ? (view.author?.name ?? "")
                        : (employeesById.get(view.recipientId)?.name ?? "");
                return counterpartName.toLowerCase().includes(term) || view.message.toLowerCase().includes(term);
            })
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
}
