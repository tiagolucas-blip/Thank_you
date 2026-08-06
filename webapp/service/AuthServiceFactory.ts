import type IAuthService from "./IAuthService";
import DemoAuthService from "./DemoAuthService";
import IasAuthService from "./IasAuthService";
import { AUTH_MODE } from "./runtimeConfig.generated";

let instance: IAuthService | undefined;

/**
 * Único ponto de seleção da implementação de autenticação, por
 * AUTH_MODE. Nenhum controller deve instanciar DemoAuthService/
 * IasAuthService diretamente — ver CLAUDE.md secção 6.
 */
export function getAuthService(): IAuthService {
    if (!instance) {
        instance = AUTH_MODE === "ias" ? new IasAuthService() : new DemoAuthService();
    }
    return instance;
}
