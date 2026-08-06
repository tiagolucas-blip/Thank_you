import employeesData from "../_data/employees.json" with { type: "json" };
import employeeExclusionsData from "../_data/employeeExclusions.json" with { type: "json" };
import recognitionCategoriesData from "../_data/recognitionCategories.json" with { type: "json" };
import closedQuestionsData from "../_data/closedQuestions.json" with { type: "json" };
import notificationMetadataData from "../_data/notificationMetadata.json" with { type: "json" };
import recognitionRecordsData from "../_data/recognitionRecords.json" with { type: "json" };
import type {
    ClosedQuestion,
    Employee,
    EmployeeExclusion,
    NotificationMetadata,
    RecognitionCategory,
    RecognitionRecord
} from "./types.ts";

/**
 * Estado em memória do seed fictício (XPTO), usado pela implementação
 * "vercel-api" da camada de dados. Cada instância serverless arranca com
 * este seed — não há persistência entre cold starts nesta fase de
 * demonstração; RecognitionRecord.status "Guardado no backend de RH" só
 * é real a partir da migração para SuccessFactors Employee Central
 * (ver docs/migracao-btp.md).
 */
const employees: Employee[] = employeesData as Employee[];
const employeeExclusions: EmployeeExclusion[] = employeeExclusionsData as EmployeeExclusion[];
const recognitionCategories: RecognitionCategory[] = recognitionCategoriesData as RecognitionCategory[];
const closedQuestions: ClosedQuestion[] = closedQuestionsData as ClosedQuestion[];
const notificationMetadata: NotificationMetadata[] = notificationMetadataData as NotificationMetadata[];
const recognitionRecords: RecognitionRecord[] = [...(recognitionRecordsData as RecognitionRecord[])];

export function listEmployees(): Employee[] {
    return employees;
}

export function findEmployeeById(id: string): Employee | undefined {
    return employees.find((employee) => employee.id === id);
}

export function listActiveExclusionIds(): Set<string> {
    return new Set(employeeExclusions.filter((exclusion) => exclusion.active).map((exclusion) => exclusion.employeeId));
}

export function listRecognitionCategories(): RecognitionCategory[] {
    return recognitionCategories;
}

export function listClosedQuestions(): ClosedQuestion[] {
    return closedQuestions;
}

export function listNotificationMetadata(): NotificationMetadata[] {
    return notificationMetadata;
}

export function listRecognitionRecords(): RecognitionRecord[] {
    return recognitionRecords;
}

export function addRecognitionRecord(record: RecognitionRecord): void {
    recognitionRecords.push(record);
}

/** Registo em memória dos payloads de notificação "enviados" pelo stub — só para inspeção/demo (requisito 6). */
const dispatchedNotificationLog: unknown[] = [];

export function recordDispatchedNotification(payload: unknown): void {
    dispatchedNotificationLog.push(payload);
}

export function listDispatchedNotifications(): unknown[] {
    return dispatchedNotificationLog;
}
