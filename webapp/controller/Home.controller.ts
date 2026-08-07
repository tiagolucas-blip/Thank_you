import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import Fragment from "sap/ui/core/Fragment";
import Dialog from "sap/m/Dialog";
import Control from "sap/ui/core/Control";
import Event from "sap/ui/base/Event";
import MessageToast from "sap/m/MessageToast";
import type { Select$ChangeEvent } from "sap/m/Select";
import type { SearchField$LiveChangeEvent } from "sap/m/SearchField";
import type { Button$PressEvent } from "sap/m/Button";
import { getRecognitionService } from "../service/ServiceFactory";
import { getAuthService } from "../service/AuthServiceFactory";
import { getTelemetryService } from "../service/TelemetryServiceFactory";
import { setCurrentDemoIdentity } from "../service/DemoUserStore";
import { setStoredLanguage } from "../service/LanguagePreference";
import type { SupportedLanguage } from "../service/LanguagePreference";
import { LatestRequestGuard } from "../model/asyncSequence";
import { ratingToPercentValue } from "../model/rating";
import NewRecognitionDialog from "./NewRecognitionDialog";
import type Component from "../Component";
import type { CategoryRating, Employee, RecognitionCategory, RecognitionRecordView } from "../service/types";

interface GivenRow extends RecognitionRecordView {
    recipientName: string;
}

/**
 * @namespace com.xpto.thankyou.controller
 */
export default class Home extends BaseController {
    private employeesById: Map<string, Employee> = new Map();
    private categoryLabelKeyById: Map<string, string> = new Map();
    private categories: RecognitionCategory[] = [];
    private detailDialog?: Dialog;
    private newRecognitionDialog?: NewRecognitionDialog;
    private readonly receivedSearchGuard = new LatestRequestGuard();
    private readonly givenSearchGuard = new LatestRequestGuard();

    public onInit(): void {
        const oModel = new JSONModel({
            busy: true,
            topPerformers: [],
            received: [],
            given: [],
            receivedSearch: "",
            givenSearch: "",
            kpis: {
                receivedCount: 0,
                givenCount: 0,
                averagePercent: 0
            }
        });
        this.getView()?.setModel(oModel, "home");
        void this.loadData();
    }

    public onDemoUserChange(oEvent: Select$ChangeEvent): void {
        const selectedItem = oEvent.getParameter("selectedItem");
        const employeeId = selectedItem?.getKey();
        if (!employeeId) {
            return;
        }
        setCurrentDemoIdentity(employeeId);
        const oComponent = this.getOwnerComponent() as Component;
        void oComponent.refreshCurrentUser().then(() => this.loadData());
    }

    /**
     * A troca de idioma nunca acontece em runtime — sap.base.i18n.Localization
     * não invalida o ResourceBundle já cacheado em Component.ts (ver o
     * comentário lá), e recarregar cada texto imperativo em todos os
     * controllers seria mais frágil do que simplesmente recarregar a
     * página com a preferência já guardada (aplicada por um script inline
     * em index.html antes do bootstrap UI5 arrancar).
     */
    public onLanguageChange(oEvent: Select$ChangeEvent): void {
        const language = oEvent.getParameter("selectedItem")?.getKey() as SupportedLanguage | undefined;
        if (!language) {
            return;
        }
        setStoredLanguage(language);
        window.location.reload();
    }

    public onGoToAdminPress(): void {
        this.getRouter().navTo("admin");
    }

    public async onSendRecognitionPress(): Promise<void> {
        const view = this.getView();
        if (!view) {
            return;
        }
        if (!this.newRecognitionDialog) {
            this.newRecognitionDialog = new NewRecognitionDialog(this.getResourceBundle(), () => void this.loadData());
        }
        await this.newRecognitionDialog.open(view, Array.from(this.employeesById.values()), this.categories);
    }

    public onReceivedSearch(oEvent: SearchField$LiveChangeEvent): void {
        const query = oEvent.getParameter("newValue") ?? "";
        void this.reloadReceived(query);
    }

    public onGivenSearch(oEvent: SearchField$LiveChangeEvent): void {
        const query = oEvent.getParameter("newValue") ?? "";
        void this.reloadGiven(query);
    }

    public async onViewDetailReceived(oEvent: Button$PressEvent): Promise<void> {
        const record = this.recordFromEvent(oEvent);
        if (record) {
            await this.openDetailDialog(record, "received");
        }
    }

    public async onViewDetailGiven(oEvent: Button$PressEvent): Promise<void> {
        const record = this.recordFromEvent(oEvent);
        if (record) {
            await this.openDetailDialog(record, "given");
        }
    }

    public onDetailDialogClose(): void {
        this.detailDialog?.close();
    }

    public formatRoleLabel(role: string | undefined): string {
        if (!role) {
            return "";
        }
        return this.getResourceBundle().getText(role === "ADMIN" ? "roleAdmin" : "roleEmployee") ?? role;
    }

    public formatTopPerformerCount(count: number | undefined): string {
        return this.getResourceBundle().getText("topPerformerCount", [count ?? 0]) ?? "";
    }

    public formatCategoryLabel(labelKey: string | undefined): string {
        if (!labelKey) {
            return "";
        }
        return this.getResourceBundle().getText(labelKey) ?? labelKey;
    }

    private recordFromEvent(oEvent: Event): RecognitionRecordView | undefined {
        const oSource = oEvent.getSource() as Control;
        return oSource.getBindingContext("home")?.getObject() as RecognitionRecordView | undefined;
    }

    private async loadData(): Promise<void> {
        const oModel = this.getHomeModel();
        oModel.setProperty("/busy", true);

        try {
            const service = await getRecognitionService();
            const currentUser = await getAuthService().getCurrentUser();

            const [employees, categories, topPerformers, received, given] = await Promise.all([
                service.searchEmployees({}),
                service.getCategories(),
                service.getTopPerformers(),
                service.getReceivedRecognitions(currentUser.employee.id, oModel.getProperty("/receivedSearch")),
                service.getGivenRecognitions(currentUser.employee.id, oModel.getProperty("/givenSearch"))
            ]);

            this.indexEmployees(employees);
            this.indexCategories(categories);
            this.categories = categories;

            oModel.setData({
                busy: false,
                topPerformers,
                received,
                given: this.withRecipientNames(given),
                receivedSearch: oModel.getProperty("/receivedSearch") ?? "",
                givenSearch: oModel.getProperty("/givenSearch") ?? "",
                kpis: this.computeKpis(received, given)
            });

            getTelemetryService().recordPageView("home", { role: currentUser.role });
        } catch (error) {
            getTelemetryService().recordError("home_load_failed", error);
            oModel.setProperty("/busy", false);
            MessageToast.show(this.getResourceBundle().getText("dataLoadFailedError") ?? "");
        }
    }

    private async reloadReceived(search: string): Promise<void> {
        try {
            const received = await this.receivedSearchGuard.run(async () => {
                const service = await getRecognitionService();
                const currentUser = await getAuthService().getCurrentUser();
                return service.getReceivedRecognitions(currentUser.employee.id, search);
            });
            if (received === undefined) {
                return;
            }
            const oModel = this.getHomeModel();
            oModel.setProperty("/received", received);
            oModel.setProperty("/receivedSearch", search);
            oModel.setProperty("/kpis/receivedCount", received.length);
        } catch (error) {
            getTelemetryService().recordError("home_received_search_failed", error);
            MessageToast.show(this.getResourceBundle().getText("dataLoadFailedError") ?? "");
        }
    }

    private async reloadGiven(search: string): Promise<void> {
        try {
            const given = await this.givenSearchGuard.run(async () => {
                const service = await getRecognitionService();
                const currentUser = await getAuthService().getCurrentUser();
                return service.getGivenRecognitions(currentUser.employee.id, search);
            });
            if (given === undefined) {
                return;
            }
            const oModel = this.getHomeModel();
            oModel.setProperty("/given", this.withRecipientNames(given));
            oModel.setProperty("/givenSearch", search);
            oModel.setProperty("/kpis/givenCount", given.length);
        } catch (error) {
            getTelemetryService().recordError("home_given_search_failed", error);
            MessageToast.show(this.getResourceBundle().getText("dataLoadFailedError") ?? "");
        }
    }

    private async openDetailDialog(record: RecognitionRecordView, direction: "received" | "given"): Promise<void> {
        if (!this.detailDialog) {
            this.detailDialog = (await Fragment.load({
                id: this.getView()?.getId(),
                name: "com.xpto.thankyou.fragment.RecognitionDetail",
                controller: this
            })) as Dialog;
            this.getView()?.addDependent(this.detailDialog);
        }

        const directionLabel = this.getResourceBundle().getText(
            direction === "received" ? "detailDialogAuthorLabel" : "detailDialogRecipientLabel"
        );
        const counterpartDisplayName =
            direction === "received"
                ? (record.author?.name ?? this.getResourceBundle().getText("anonymousAuthor"))
                : (this.employeesById.get(record.recipientId)?.name ?? record.recipientId);

        const categoryRatings = record.categoryRatings.map((entry: CategoryRating) => ({
            ...entry,
            labelKey: this.categoryLabelKeyById.get(entry.categoryId) ?? entry.categoryId
        }));

        this.detailDialog.setModel(
            new JSONModel({
                direction,
                directionLabel,
                counterpartDisplayName,
                createdAt: record.createdAt,
                overallRating: record.overallRating,
                message: record.message,
                categoryRatings
            })
        );
        this.detailDialog.open();
    }

    private indexEmployees(employees: Employee[]): void {
        this.employeesById = new Map(employees.map((employee) => [employee.id, employee]));
    }

    private indexCategories(categories: RecognitionCategory[]): void {
        this.categoryLabelKeyById = new Map();
        const flatten = (list: RecognitionCategory[]): void => {
            for (const category of list) {
                this.categoryLabelKeyById.set(category.id, category.labelKey);
                if (category.subcategories?.length) {
                    flatten(category.subcategories);
                }
            }
        };
        flatten(categories);
    }

    private withRecipientNames(given: RecognitionRecordView[]): GivenRow[] {
        return given.map((entry) => ({
            ...entry,
            recipientName: this.employeesById.get(entry.recipientId)?.name ?? entry.recipientId
        }));
    }

    private computeKpis(received: RecognitionRecordView[], given: RecognitionRecordView[]): Record<string, unknown> {
        const averageRating =
            received.length === 0 ? 0 : received.reduce((sum, entry) => sum + entry.overallRating, 0) / received.length;

        return {
            receivedCount: received.length,
            givenCount: given.length,
            averagePercent: ratingToPercentValue(averageRating)
        };
    }

    private getHomeModel(): JSONModel {
        return this.getView()?.getModel("home") as JSONModel;
    }
}
