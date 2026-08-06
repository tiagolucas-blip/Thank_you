import Controller from "sap/ui/core/mvc/Controller";
import UIComponent from "sap/ui/core/UIComponent";
import Router from "sap/ui/core/routing/Router";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import ResourceBundle from "sap/base/i18n/ResourceBundle";

/**
 * @namespace com.xpto.thankyou.controller
 */
export default abstract class BaseController extends Controller {
    public getRouter(): Router {
        return UIComponent.getRouterFor(this) as Router;
    }

    public getResourceBundle(): ResourceBundle {
        const oModel = this.getOwnerComponent()?.getModel("i18n") as ResourceModel;
        return oModel.getResourceBundle() as unknown as ResourceBundle;
    }
}
