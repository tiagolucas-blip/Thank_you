import type {
    DashboardMetrics,
    Employee,
    RecognitionCategory,
    RecognitionRecordView,
    RecognitionSubmission,
    RecognitionSubmissionResult,
    TopPerformerEntry
} from "./types";

/**
 * Interface única da camada de dados (CLAUDE.md secção 6). As três
 * implementações (mock, vercel-api, odata) têm de a respeitar por
 * completo para que trocar DATA_SOURCE nunca implique alterar um
 * controller.
 */
export default interface IRecognitionService {
    searchEmployees(params: { search?: string; orgArea?: string }): Promise<Employee[]>;
    getCategories(): Promise<RecognitionCategory[]>;
    getReceivedRecognitions(employeeId: string, search?: string): Promise<RecognitionRecordView[]>;
    getGivenRecognitions(employeeId: string, search?: string): Promise<RecognitionRecordView[]>;
    submitRecognition(submission: RecognitionSubmission): Promise<RecognitionSubmissionResult>;
    getTopPerformers(): Promise<TopPerformerEntry[]>;
    getPublicCounters(): Promise<Record<string, number>>;
    getDashboardMetrics(year: number): Promise<DashboardMetrics>;
}
