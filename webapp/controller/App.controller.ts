import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";

/**
 * @namespace com.xpto.thankyou.controller
 */
export default class App extends BaseController {
    public onInit(): void {
        const oAppViewModel = new JSONModel({
            busy: false,
            delay: 0
        });
        this.getView()?.setModel(oAppViewModel, "appView");
    }
}
