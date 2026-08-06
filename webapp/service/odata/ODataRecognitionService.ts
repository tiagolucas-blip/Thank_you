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

const NOT_IMPLEMENTED =
    "ODataRecognitionService: por implementar na migração para SAP BTP — ver docs/migracao-btp.md. " +
    "O contrato (IRecognitionService) já está definido; falta ligar cada método a um " +
    "sap.ui.model.odata.v4.ODataListBinding/ODataContextBinding sobre o serviço CAP.";

/**
 * Esqueleto DATA_SOURCE=odata: para sap.ui.model.odata.v4.ODataModel
 * apontado ao serviço CAP Node.js ou ao destino BTP. Implementação
 * deixada incompleta de propósito nesta fase — o contrato está definido
 * para que a troca de mock/vercel-api para odata seja só isto: trocar a
 * classe instanciada em ServiceFactory.ts.
 */
export default class ODataRecognitionService implements IRecognitionService {
    public async searchEmployees(_params: { search?: string; orgArea?: string }): Promise<Employee[]> {
        throw new Error(NOT_IMPLEMENTED);
    }

    public async getCategories(): Promise<RecognitionCategory[]> {
        throw new Error(NOT_IMPLEMENTED);
    }

    public async getReceivedRecognitions(_employeeId: string, _search?: string): Promise<RecognitionRecordView[]> {
        throw new Error(NOT_IMPLEMENTED);
    }

    public async getGivenRecognitions(_employeeId: string, _search?: string): Promise<RecognitionRecordView[]> {
        throw new Error(NOT_IMPLEMENTED);
    }

    public async submitRecognition(_submission: RecognitionSubmission): Promise<RecognitionSubmissionResult> {
        throw new Error(NOT_IMPLEMENTED);
    }

    public async getTopPerformers(): Promise<TopPerformerEntry[]> {
        throw new Error(NOT_IMPLEMENTED);
    }

    public async getPublicCounters(): Promise<Record<string, number>> {
        throw new Error(NOT_IMPLEMENTED);
    }

    public async getDashboardMetrics(_year: number): Promise<DashboardMetrics> {
        throw new Error(NOT_IMPLEMENTED);
    }
}
