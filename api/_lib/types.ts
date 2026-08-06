export type UserRole = "EMPLOYEE" | "ADMIN";

export interface Employee {
    id: string;
    name: string;
    orgArea: string;
    photoUrl: string;
    email: string;
    managerId: string | null;
    active: boolean;
}

export interface EmployeeExclusion {
    id: string;
    employeeId: string;
    reason: string;
    createdBy: string;
    createdAt: string;
    active: boolean;
}

export interface RecognitionCategory {
    id: string;
    code: string;
    labelKey: string;
    parentCategoryId: string | null;
    order: number;
    active: boolean;
}

export type ClosedQuestionAnswerType = "BOOLEAN" | "SINGLE_CHOICE";

export interface ClosedQuestion {
    id: string;
    categoryId: string;
    code: string;
    labelKey: string;
    answerType: ClosedQuestionAnswerType;
    options: string[];
    order: number;
    active: boolean;
}

export type NotificationChannel = "EMAIL" | "TEAMS";
export type NotificationRecipientsRule = "RECIPIENT" | "AUTHOR" | "MANAGER_OF_RECIPIENT" | "ADMIN";

export interface NotificationMetadata {
    id: string;
    eventType: string;
    channel: NotificationChannel;
    templateKey: string;
    subjectKey: string;
    recipientsRule: NotificationRecipientsRule;
    active: boolean;
}

export interface CategoryRating {
    categoryId: string;
    rating: number;
    observations?: string;
}

export interface ClosedAnswer {
    closedQuestionId: string;
    answerValue: string;
}

export interface RecognitionRecord {
    id: string;
    authorId: string;
    recipientId: string;
    isAnonymous: boolean;
    message: string;
    categoryRatings: CategoryRating[];
    closedAnswers: ClosedAnswer[];
    overallRating: number;
    createdAt: string;
    status: "SUBMITTED";
}

export interface RecognitionSubmission {
    authorId: string;
    recipientId: string;
    isAnonymous: boolean;
    message: string;
    categoryRatings: CategoryRating[];
    closedAnswers: ClosedAnswer[];
}

/** Vista pública/API de um autor — nunca inclui dados quando o reconhecimento é anónimo. */
export interface RecognitionAuthorView {
    id: string;
    name: string;
    photoUrl: string;
}

/** RecognitionRecord tal como serializado para o cliente: authorId nunca sai daqui quando isAnonymous=true. */
export interface RecognitionRecordView {
    id: string;
    author: RecognitionAuthorView | null;
    isAnonymous: boolean;
    recipientId: string;
    message: string;
    categoryRatings: CategoryRating[];
    closedAnswers: ClosedAnswer[];
    overallRating: number;
    createdAt: string;
    status: "SUBMITTED";
}

export interface TopPerformerEntry {
    employee: RecognitionAuthorView;
    recognitionCount: number;
    averageRating: number;
}

export interface DashboardMetrics {
    year: number;
    totalRecognitions: number;
    averageRating: number;
    averageRatingPercent: number;
    activeUsers: number;
    topCategoriesByRating: Array<{ categoryId: string; labelKey: string; averageRating: number }>;
    recognitionsByMonth: Array<{ month: number; count: number }>;
}
