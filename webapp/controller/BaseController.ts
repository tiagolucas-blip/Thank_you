import Controller from "sap/ui/core/mvc/Controller";
import UIComponent from "sap/ui/core/UIComponent";
import Router from "sap/ui/core/routing/Router";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import type Component from "../Component";

/**
 * @namespace com.xpto.thankyou.controller
 */
export default abstract class BaseController extends Controller {
    public getRouter(): Router {
        return UIComponent.getRouterFor(this) as Router;
    }

    /**
     * O i18n ResourceModel carrega de forma assíncrona (manifest.json
     * `async: true`); o Component resolve e cacheia o bundle uma única vez
     * em Component.ts#loadResourceBundle(). Lança um erro claro em vez de
     * devolver undefined se for chamado antes disso — nas views desta app
     * isso só aconteceria antes de qualquer dado estar carregado.
     */
    public getResourceBundle(): ResourceBundle {
        const bundle = (this.getOwnerComponent() as Component)?.getResourceBundleSync();
        if (!bundle) {
            throw new Error("ResourceBundle ainda não está pronto — ver Component.ts#loadResourceBundle().");
        }
        return bundle;
    }
}
