import UIComponent from "sap/ui/core/UIComponent";
import JSONModel from "sap/ui/model/json/JSONModel";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import { getAuthService } from "./service/AuthServiceFactory";
import { DEMO_IDENTITIES } from "./service/DemoUserStore";
import { AUTH_MODE } from "./service/runtimeConfig.generated";

/**
 * @namespace com.xpto.thankyou
 */
export default class Component extends UIComponent {
    public static readonly metadata = {
        manifest: "json",
        interfaces: ["sap.ui.core.IAsyncContentCreation"]
    };

    private resourceBundle?: ResourceBundle;

    public init(): void {
        super.init();

        this.setModel(
            new JSONModel({
                currentUser: null,
                isDemoMode: AUTH_MODE === "demo",
                demoIdentities:
                    AUTH_MODE === "demo" ? DEMO_IDENTITIES.map((identity) => ({ ...identity.employee })) : []
            }),
            "app"
        );
        void this.refreshCurrentUser();
        void this.loadResourceBundle();

        this.getRouter().initialize();
    }

    /** Chamado após o seletor de demonstração mudar de utilizador (ver Home.controller.ts). */
    public async refreshCurrentUser(): Promise<void> {
        const currentUser = await getAuthService().getCurrentUser();
        (this.getModel("app") as JSONModel).setProperty("/currentUser", currentUser);
    }

    /**
     * O modelo i18n carrega de forma assíncrona (CLAUDE.md secção 6:
     * "carregamento assíncrono em todo o lado"), mas os formatters usados
     * nas views têm de devolver texto de forma síncrona. Resolve-se a
     * Promise uma única vez aqui e cacheia-se o resultado — o texto do
     * bundle não muda depois de carregado (não há troca de idioma nesta
     * fase). Ver BaseController.getResourceBundle().
     */
    private async loadResourceBundle(): Promise<void> {
        const i18nModel = this.getModel("i18n") as ResourceModel;
        this.resourceBundle = (await i18nModel.getResourceBundle()) as ResourceBundle;
    }

    public getResourceBundleSync(): ResourceBundle | undefined {
        return this.resourceBundle;
    }
}
