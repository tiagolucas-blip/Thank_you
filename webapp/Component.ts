import UIComponent from "sap/ui/core/UIComponent";

/**
 * @namespace com.xpto.thankyou
 */
export default class Component extends UIComponent {
    public static readonly metadata = {
        manifest: "json",
        interfaces: ["sap.ui.core.IAsyncContentCreation"]
    };

    public init(): void {
        super.init();
        this.getRouter().initialize();
    }
}
