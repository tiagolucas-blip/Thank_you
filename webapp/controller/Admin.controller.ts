import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import MessageToast from "sap/m/MessageToast";
import DateFormat from "sap/ui/core/format/DateFormat";
import type { Select$ChangeEvent } from "sap/m/Select";
import type { SearchField$LiveChangeEvent } from "sap/m/SearchField";
import { getRecognitionService } from "../service/ServiceFactory";
import { getAuthService } from "../service/AuthServiceFactory";
import { getTelemetryService } from "../service/TelemetryServiceFactory";
import { buildBarChart, buildDonutChart } from "../model/charts";
import { LatestRequestGuard } from "../model/asyncSequence";
import type { DashboardMetrics, RecognitionRecordView, TopPerformerEntry } from "../service/types";

const CATEGORY_CHART_COLORS = [
    "--sapChart_OrderedColor_1",
    "--sapChart_OrderedColor_2",
    "--sapChart_OrderedColor_3",
    "--sapChart_OrderedColor_4",
    "--sapChart_OrderedColor_5",
    "--sapChart_OrderedColor_6"
];

interface CategoryLegendEntry {
    label: string;
    value: string;
    swatchClass: string;
}

/**
 * @namespace com.xpto.thankyou.controller
 */
export default class Admin extends BaseController {
    private monthFormatter = DateFormat.getDateInstance({ pattern: "MMM" });
    private readonly recentSearchGuard = new LatestRequestGuard();

    public onInit(): void {
        const currentYear = new Date().getUTCFullYear();
        const oModel = new JSONModel({
            busy: true,
            kpis: { totalRecognitions: 0, totalAveragePercent: 0, activeUsers: 0 },
            topPerformers: [],
            categoryChartSvg: "",
            categoryChartAriaLabel: "",
            categoryLegend: [] as CategoryLegendEntry[],
            monthChartSvg: "",
            monthChartAriaLabel: "",
            yearOptions: [currentYear, currentYear - 1, currentYear - 2].map((year) => ({
                key: String(year),
                text: String(year)
            })),
            selectedYear: String(currentYear),
            recentRecognitions: [],
            recentSearch: ""
        });
        this.getView()?.setModel(oModel, "admin");
        this.getRouter()
            .getRoute("admin")
            ?.attachMatched(() => void this.onRouteMatched(), this);
    }

    public onBackPress(): void {
        this.getRouter().navTo("home");
    }

    public onYearChange(oEvent: Select$ChangeEvent): void {
        const year = oEvent.getParameter("selectedItem")?.getKey();
        if (!year) {
            return;
        }
        this.getAdminModel().setProperty("/selectedYear", year);
        void this.loadDashboard(Number.parseInt(year, 10));
    }

    public onRecentSearch(oEvent: SearchField$LiveChangeEvent): void {
        const query = oEvent.getParameter("newValue") ?? "";
        void this.loadRecent(query);
    }

    public formatCategoryLabel(labelKey: string | undefined): string {
        if (!labelKey) {
            return "";
        }
        return this.getResourceBundle().getText(labelKey) ?? labelKey;
    }

    private async onRouteMatched(): Promise<void> {
        const isAdmin = await getAuthService().hasRole("ADMIN");
        if (!isAdmin) {
            MessageToast.show(this.getResourceBundle().getText("adminAccessDeniedMessage") ?? "");
            this.getRouter().navTo("home");
            return;
        }

        const oModel = this.getAdminModel();
        oModel.setProperty("/busy", true);

        try {
            // Cada loader trata os seus próprios erros (toast + telemetria)
            // e nunca rejeita — uma falha isolada (ex.: só o gráfico de
            // categorias) não impede os outros dois de carregar.
            await Promise.all([
                this.loadDashboard(Number.parseInt(oModel.getProperty("/selectedYear") as string, 10)),
                this.loadTopPerformers(),
                this.loadRecent("")
            ]);
            getTelemetryService().recordPageView("admin_dashboard", { role: "ADMIN" });
        } catch (error) {
            getTelemetryService().recordError("admin_dashboard_load_failed", error);
            MessageToast.show(this.getResourceBundle().getText("dataLoadFailedError") ?? "");
        } finally {
            oModel.setProperty("/busy", false);
        }
    }

    private async loadTopPerformers(): Promise<void> {
        try {
            const service = await getRecognitionService();
            const topPerformers: TopPerformerEntry[] = await service.getTopPerformers();
            this.getAdminModel().setProperty("/topPerformers", topPerformers);
        } catch (error) {
            getTelemetryService().recordError("admin_top_performers_failed", error);
            MessageToast.show(this.getResourceBundle().getText("dataLoadFailedError") ?? "");
        }
    }

    private async loadRecent(search: string): Promise<void> {
        try {
            const recent = await this.recentSearchGuard.run<RecognitionRecordView[]>(async () => {
                const service = await getRecognitionService();
                return service.getRecentRecognitions(search);
            });
            if (recent === undefined) {
                return;
            }
            const oModel = this.getAdminModel();
            oModel.setProperty("/recentRecognitions", recent);
            oModel.setProperty("/recentSearch", search);
        } catch (error) {
            getTelemetryService().recordError("admin_recent_search_failed", error);
            MessageToast.show(this.getResourceBundle().getText("dataLoadFailedError") ?? "");
        }
    }

    private async loadDashboard(year: number): Promise<void> {
        try {
            const service = await getRecognitionService();
            const metrics: DashboardMetrics = await service.getDashboardMetrics(year);
            const oModel = this.getAdminModel();

            oModel.setProperty("/kpis", {
                totalRecognitions: metrics.totalRecognitions,
                totalAveragePercent: metrics.averageRatingPercent,
                activeUsers: metrics.activeUsers
            });

            this.applyCategoryChart(metrics);
            this.applyMonthChart(metrics);
        } catch (error) {
            getTelemetryService().recordError("admin_dashboard_metrics_failed", error);
            MessageToast.show(this.getResourceBundle().getText("dataLoadFailedError") ?? "");
        }
    }

    private applyCategoryChart(metrics: DashboardMetrics): void {
        const oModel = this.getAdminModel();
        const top = metrics.topCategoriesByRating.slice(0, CATEGORY_CHART_COLORS.length);
        const segments = top.map((category, index) => ({
            label: this.formatCategoryLabel(category.labelKey),
            value: category.averageRating,
            colorVar: CATEGORY_CHART_COLORS[index % CATEGORY_CHART_COLORS.length]
        }));

        const legend: CategoryLegendEntry[] = segments.map((segment, index) => ({
            label: segment.label,
            value: `${segment.value.toFixed(1)}/5`,
            swatchClass: `thankyouSwatch${index + 1}`
        }));

        const ariaSummary = segments.map((segment) => `${segment.label}: ${segment.value.toFixed(1)} de 5`).join("; ");
        const ariaPrefix = this.getResourceBundle().getText("categoriesChartAriaLabelPrefix") ?? "";

        oModel.setProperty("/categoryChartSvg", buildDonutChart(segments));
        oModel.setProperty("/categoryChartAriaLabel", segments.length ? `${ariaPrefix}. ${ariaSummary}.` : "");
        oModel.setProperty("/categoryLegend", legend);
    }

    private applyMonthChart(metrics: DashboardMetrics): void {
        const oModel = this.getAdminModel();
        const data = metrics.recognitionsByMonth.map((entry) => ({
            label: this.monthFormatter.format(new Date(Date.UTC(metrics.year, entry.month - 1, 1))),
            value: entry.count
        }));

        const ariaSummary = data.map((datum) => `${datum.label}: ${datum.value}`).join("; ");
        const ariaPrefix = this.getResourceBundle().getText("monthChartAriaLabelPrefix") ?? "";

        oModel.setProperty("/monthChartSvg", buildBarChart(data));
        oModel.setProperty("/monthChartAriaLabel", `${ariaPrefix} (${metrics.year}). ${ariaSummary}.`);
    }

    private getAdminModel(): JSONModel {
        return this.getView()?.getModel("admin") as JSONModel;
    }
}
