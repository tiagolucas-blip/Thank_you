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

async function demoHeaders(): Promise<Record<string, string>> {
    const currentUser = await getAuthService().getCurrentUser();
    return {
        "x-demo-user-id": currentUser.employee.id,
        "x-demo-role": currentUser.role
    };
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = { ...(await demoHeaders()), ...(init.headers ?? {}) };
    const response = await fetch(path, { ...init, headers });
    const body = (await response.json()) as T | { error: string };

    if (!response.ok) {
        const message =
            "error" in (body as { error?: string }) ? (body as { error: string }).error : response.statusText;
        throw new Error(message);
    }
    return body as T;
}

/**
 * Implementação DATA_SOURCE=vercel-api: consome as Vercel Functions em
 * /api, que nesta fase representam o papel do futuro SAP Integration
 * Suite (ver docs/migracao-btp.md).
 */
export default class VercelApiRecognitionService implements IRecognitionService {
    public async searchEmployees(params: { search?: string; orgArea?: string }): Promise<Employee[]> {
        const query = new URLSearchParams();
        if (params.search) {
            query.set("search", params.search);
        }
        if (params.orgArea) {
            query.set("orgArea", params.orgArea);
        }
        const { employees } = await requestJson<{ employees: Employee[] }>(`/api/employees?${query.toString()}`);
        return employees;
    }

    public async getCategories(): Promise<RecognitionCategory[]> {
        const { categories } = await requestJson<{ categories: RecognitionCategory[] }>("/api/categories");
        return categories;
    }

    public async getReceivedRecognitions(employeeId: string, search?: string): Promise<RecognitionRecordView[]> {
        return this.getRecognitions(employeeId, "received", search);
    }

    public async getGivenRecognitions(employeeId: string, search?: string): Promise<RecognitionRecordView[]> {
        return this.getRecognitions(employeeId, "given", search);
    }

    public async submitRecognition(submission: RecognitionSubmission): Promise<RecognitionSubmissionResult> {
        return requestJson<RecognitionSubmissionResult>("/api/recognitions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(submission)
        });
    }

    public async getTopPerformers(): Promise<TopPerformerEntry[]> {
        const { topPerformers } = await requestJson<{ topPerformers: TopPerformerEntry[] }>("/api/top-performers");
        return topPerformers;
    }

    public async getPublicCounters(): Promise<Record<string, number>> {
        const { counters } = await requestJson<{ counters: Record<string, number> }>("/api/top-performers");
        return counters;
    }

    public async getDashboardMetrics(year: number): Promise<DashboardMetrics> {
        return requestJson<DashboardMetrics>(`/api/dashboard-metrics?year=${year}`);
    }

    private async getRecognitions(
        employeeId: string,
        direction: "received" | "given",
        search?: string
    ): Promise<RecognitionRecordView[]> {
        const query = new URLSearchParams({ employeeId, direction });
        if (search) {
            query.set("search", search);
        }
        const { recognitions } = await requestJson<{ recognitions: RecognitionRecordView[] }>(
            `/api/recognitions?${query.toString()}`
        );
        return recognitions;
    }
}
