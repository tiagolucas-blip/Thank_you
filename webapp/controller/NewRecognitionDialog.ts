import JSONModel from "sap/ui/model/json/JSONModel";
import Fragment from "sap/ui/core/Fragment";
import Dialog from "sap/m/Dialog";
import MessageToast from "sap/m/MessageToast";
import Control from "sap/ui/core/Control";
import View from "sap/ui/core/mvc/View";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import type { Input$SuggestEvent, Input$SuggestionItemSelectedEvent } from "sap/m/Input";
import type { InputBase$ChangeEvent } from "sap/m/InputBase";
import type { Select$ChangeEvent } from "sap/m/Select";
import type { RatingIndicator$ChangeEvent } from "sap/m/RatingIndicator";
import type { Button$PressEvent } from "sap/m/Button";
import { getRecognitionService } from "../service/ServiceFactory";
import { validateRecognitionForm } from "../service/validation";
import { ServiceError } from "../service/errors";
import { getTelemetryService } from "../service/TelemetryServiceFactory";
import type {
    ClosedQuestion,
    Employee,
    RecognitionCategory,
    RecognitionSubmission,
    ClosedAnswer as ServiceClosedAnswer,
    CategoryRating as ServiceCategoryRating
} from "../service/types";

interface ClosedAnswerOption {
    value: string;
    labelKey: string;
}

interface ClosedAnswerEntry {
    closedQuestionId: string;
    labelKey: string;
    options: ClosedAnswerOption[];
    answerValue: string;
}

interface CategoryEntry {
    id: string;
    labelKey: string;
    rating: number;
    observations: string;
    closedAnswers: ClosedAnswerEntry[];
    subcategories: CategoryEntry[];
}

interface DialogModelData {
    busy: boolean;
    recipientSearch: string;
    recipientId: string;
    recipientValueState: "None" | "Error";
    recipientValueStateText: string;
    employeeSuggestions: Employee[];
    orgAreaOptions: Array<{ key: string; text: string }>;
    selectedOrgArea: string;
    categories: CategoryEntry[];
    message: string;
    messageValueState: "None" | "Error";
    messageValueStateText: string;
    isAnonymous: boolean;
    categoryRatingError: string;
    isValid: boolean;
}

const CLOSED_OPTION_LABEL_KEYS: Record<string, string> = {
    OCCASIONAL: "closedQuestionOptionOccasional",
    REGULAR: "closedQuestionOptionRegular",
    CONSTANT: "closedQuestionOptionConstant"
};

/**
 * Mapa código de erro do serviço (mock/vercel-api, ver
 * webapp/service/errors.ts) -> chave i18n. Um código sem entrada aqui cai
 * no fallback genérico "recognitionSubmitFailed" — nunca se mostra
 * error.message (não traduzido) diretamente ao utilizador.
 */
const SUBMIT_ERROR_MESSAGE_KEYS: Record<string, string> = {
    recipientRequired: "recipientRequiredError",
    selfRecognitionNotAllowed: "selfRecognitionNotAllowedError",
    messageRequired: "messageRequiredError",
    categoryRatingRequired: "categoryRatingRequiredError",
    categoryRatingRange: "categoryRatingRangeError"
};

function buildClosedQuestionOptions(question: ClosedQuestion): ClosedAnswerOption[] {
    if (question.answerType === "BOOLEAN") {
        return [
            { value: "true", labelKey: "closedQuestionAnswerYes" },
            { value: "false", labelKey: "closedQuestionAnswerNo" }
        ];
    }
    return question.options.map((value) => ({ value, labelKey: CLOSED_OPTION_LABEL_KEYS[value] ?? value }));
}

function toCategoryEntry(category: RecognitionCategory): CategoryEntry {
    return {
        id: category.id,
        labelKey: category.labelKey,
        rating: 0,
        observations: "",
        closedAnswers: (category.closedQuestions ?? []).map((question) => ({
            closedQuestionId: question.id,
            labelKey: question.labelKey,
            answerValue: "",
            options: buildClosedQuestionOptions(question)
        })),
        subcategories: (category.subcategories ?? []).map((sub) => ({
            id: sub.id,
            labelKey: sub.labelKey,
            rating: 0,
            observations: "",
            closedAnswers: [],
            subcategories: []
        }))
    };
}

function flattenCategoryEntries(categories: CategoryEntry[]): CategoryEntry[] {
    return categories.flatMap((category) => [category, ...category.subcategories]);
}

/**
 * Controlador do fragment "Novo reconhecimento" (Fase 5). Não estende
 * sap.ui.core.mvc.Controller — um objeto simples com os métodos
 * referenciados por ".xxx" no XML já serve de "controller" para
 * Fragment.load, o que mantém Home.controller.ts pequeno e isola aqui a
 * lógica específica deste dialog.
 */
export default class NewRecognitionDialog {
    private dialog?: Dialog;
    private readonly model: JSONModel;
    private readonly resourceBundle: ResourceBundle;
    private readonly onSubmitted: () => void;
    private selectedEmployeeName = "";

    constructor(resourceBundle: ResourceBundle, onSubmitted: () => void) {
        this.resourceBundle = resourceBundle;
        this.onSubmitted = onSubmitted;
        this.model = new JSONModel(this.emptyModelData());
    }

    public async open(parentView: View, employees: Employee[], categories: RecognitionCategory[]): Promise<void> {
        if (!this.dialog) {
            this.dialog = (await Fragment.load({
                id: parentView.getId(),
                name: "com.xpto.thankyou.fragment.NewRecognition",
                controller: this
            })) as Dialog;
            parentView.addDependent(this.dialog);
            this.dialog.setModel(this.model);
        }

        this.selectedEmployeeName = "";
        const orgAreaOptions = this.buildOrgAreaOptions(employees);

        this.model.setData({
            ...this.emptyModelData(),
            orgAreaOptions,
            categories: categories.map(toCategoryEntry)
        });

        this.dialog.open();
    }

    public onEmployeeSuggest(oEvent: Input$SuggestEvent): void {
        const search = (oEvent.getParameter("suggestValue") ?? "").toLowerCase();
        const orgArea = this.model.getProperty("/selectedOrgArea") as string;
        void this.refreshSuggestions(search, orgArea);
    }

    public onEmployeeSelected(oEvent: Input$SuggestionItemSelectedEvent): void {
        const selectedItem = oEvent.getParameter("selectedItem");
        this.selectedEmployeeName = selectedItem?.getText() ?? "";
        this.model.setProperty("/recipientId", selectedItem?.getKey() ?? "");
        this.model.setProperty("/recipientSearch", this.selectedEmployeeName);
        this.recomputeValidity();
    }

    /**
     * Confirma no "change" (blur) do Input de pesquisa: mostra o erro
     * inline quando o campo fica vazio, e invalida a seleção anterior se
     * o texto foi alterado depois de escolher alguém sem escolher de
     * novo uma sugestão válida.
     */
    public onRecipientInputChange(oEvent: InputBase$ChangeEvent): void {
        const value = oEvent.getParameter("value") ?? "";
        if (value !== this.selectedEmployeeName) {
            this.model.setProperty("/recipientId", "");
        }
        this.recomputeValidity();
    }

    public onOrgAreaFilterChange(oEvent: Select$ChangeEvent): void {
        const key = oEvent.getParameter("selectedItem")?.getKey() ?? "";
        this.model.setProperty("/selectedOrgArea", key);
        void this.refreshSuggestions((this.model.getProperty("/recipientSearch") as string) ?? "", key);
    }

    /**
     * Só "change" (nunca "liveChange"): o RatingIndicator trata "clicar na
     * mesma estrela já selecionada" como limpar para 0. Se escrevêssemos
     * no modelo já no liveChange (que dispara ainda no mousedown, antes de
     * soltar o rato), o valor "prévia" fica confirmado por two-way binding
     * antes do mouseup correr essa comparação — todo o primeiro clique
     * parece "repetido" e o rating volta sempre a 0. "change" já dispara
     * tanto no rato (mouseup) como no teclado (setas), por isso cobre os
     * dois sem este efeito secundário.
     */
    public onCategoryRatingChange(oEvent: RatingIndicator$ChangeEvent): void {
        const source = oEvent.getSource() as Control;
        const path = source.getBindingContext()?.getPath();
        const value = oEvent.getParameter("value") ?? 0;
        if (path) {
            this.model.setProperty(`${path}/rating`, value);
            this.recomputeValidity();
        }
    }

    public onMessageLiveChange(): void {
        this.recomputeValidity();
    }

    public formatCategoryLabel(labelKey: string | undefined): string {
        if (!labelKey) {
            return "";
        }
        return this.resourceBundle.getText(labelKey) ?? labelKey;
    }

    /**
     * Nome acessível do RatingIndicator/TextArea de cada categoria (via
     * tooltip): os controlos são gerados por template, sem id próprio, por
     * isso labelFor/ariaLabelledBy não é possível — o tooltip funciona como
     * nome acessível de fallback (ver WCAG 2.1 AA — Fase 7).
     */
    public formatCategoryRatingTooltip(labelKey: string | undefined): string {
        return this.combineWithCategoryLabel("categoryRatingLabel", labelKey);
    }

    public formatObservationsTooltip(labelKey: string | undefined): string {
        return this.combineWithCategoryLabel("categoryObservationsLabel", labelKey);
    }

    private combineWithCategoryLabel(prefixKey: string, labelKey: string | undefined): string {
        const categoryLabel = this.formatCategoryLabel(labelKey);
        const prefix = this.resourceBundle.getText(prefixKey) ?? "";
        return categoryLabel ? `${prefix}: ${categoryLabel}` : prefix;
    }

    public async onSubmitPress(_oEvent: Button$PressEvent): Promise<void> {
        if (!this.recomputeValidity()) {
            return;
        }

        this.model.setProperty("/busy", true);
        try {
            const data = this.model.getData() as DialogModelData;
            const flatCategories = flattenCategoryEntries(data.categories);

            const categoryRatings: ServiceCategoryRating[] = flatCategories
                .filter((category) => category.rating > 0)
                .map((category) => ({
                    categoryId: category.id,
                    rating: category.rating,
                    observations: category.observations || undefined
                }));

            const closedAnswers: ServiceClosedAnswer[] = flatCategories
                .filter((category) => category.rating > 0)
                .flatMap((category) => category.closedAnswers)
                .filter((answer) => answer.answerValue)
                .map((answer) => ({ closedQuestionId: answer.closedQuestionId, answerValue: answer.answerValue }));

            const submission: RecognitionSubmission = {
                recipientId: data.recipientId,
                isAnonymous: data.isAnonymous,
                message: data.message,
                categoryRatings,
                closedAnswers
            };

            const service = await getRecognitionService();
            await service.submitRecognition(submission);

            getTelemetryService().recordEvent("recognition_submitted", {
                isAnonymous: submission.isAnonymous,
                categoryCount: categoryRatings.length
            });
            MessageToast.show(this.resourceBundle.getText("recognitionSubmittedSuccess") ?? "");
            this.dialog?.close();
            this.onSubmitted();
        } catch (error) {
            const code = error instanceof ServiceError ? error.code : "unknown";
            getTelemetryService().recordError("recognition_submit_failed", error, { code });
            const messageKey = error instanceof ServiceError ? SUBMIT_ERROR_MESSAGE_KEYS[error.code] : undefined;
            const message = this.resourceBundle.getText(messageKey ?? "recognitionSubmitFailed") ?? "";
            MessageToast.show(message);
        } finally {
            this.model.setProperty("/busy", false);
        }
    }

    public onCancelPress(): void {
        this.dialog?.close();
    }

    private async refreshSuggestions(search: string, orgArea: string): Promise<void> {
        const service = await getRecognitionService();
        const suggestions = await service.searchEmployees({ search, orgArea: orgArea || undefined });
        this.model.setProperty("/employeeSuggestions", suggestions);

        if (search) {
            getTelemetryService().recordEvent("employee_search", {
                queryLength: search.length,
                resultCount: suggestions.length
            });
        }
    }

    private buildOrgAreaOptions(employees: Employee[]): Array<{ key: string; text: string }> {
        const areas = Array.from(new Set(employees.map((employee) => employee.orgArea))).sort((a, b) =>
            a.localeCompare(b)
        );
        return [
            { key: "", text: this.resourceBundle.getText("allAreasOption") ?? "" },
            ...areas.map((area) => ({ key: area, text: area }))
        ];
    }

    /**
     * Requisito 5 (validação inline) — reaproveita a mesma regra do
     * serviço (webapp/service/validation.ts). A verificação de
     * auto-elogio não é alcançável aqui na prática: searchEmployees já
     * exclui sempre o próprio utilizador das sugestões (requisito 1), por
     * isso authorId fica vazio — só a repetição no serviço (Fase 3)
     * protege contra uma chamada direta à API.
     */
    private recomputeValidity(): boolean {
        const data = this.model.getData() as DialogModelData;
        const flatCategories = flattenCategoryEntries(data.categories);

        const result = validateRecognitionForm({
            authorId: "",
            recipientId: data.recipientId,
            message: data.message,
            categoryRatings: flatCategories
                .filter((category) => category.rating > 0)
                .map((category) => ({ rating: category.rating }))
        });

        this.model.setProperty("/recipientValueState", data.recipientId ? "None" : "Error");
        this.model.setProperty(
            "/recipientValueStateText",
            data.recipientId ? "" : (this.resourceBundle.getText("recipientRequiredError") ?? "")
        );
        this.model.setProperty("/messageValueState", data.message.trim() ? "None" : "Error");
        this.model.setProperty(
            "/messageValueStateText",
            data.message.trim() ? "" : (this.resourceBundle.getText("messageRequiredError") ?? "")
        );
        this.model.setProperty(
            "/categoryRatingError",
            result.errors.categoryRatings ? (this.resourceBundle.getText("categoryRatingRequiredError") ?? "") : ""
        );

        const valid = Boolean(data.recipientId) && Boolean(data.message.trim()) && !result.errors.categoryRatings;
        this.model.setProperty("/isValid", valid);
        return valid;
    }

    private emptyModelData(): DialogModelData {
        return {
            busy: false,
            recipientSearch: "",
            recipientId: "",
            recipientValueState: "None",
            recipientValueStateText: "",
            employeeSuggestions: [],
            orgAreaOptions: [],
            selectedOrgArea: "",
            categories: [],
            message: "",
            messageValueState: "None",
            messageValueStateText: "",
            isAnonymous: false,
            categoryRatingError: "",
            isValid: false
        };
    }
}
