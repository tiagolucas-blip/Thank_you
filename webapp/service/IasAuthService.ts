import type IAuthService from "./IAuthService";
import type { CurrentUser } from "./IAuthService";
import type { UserRole } from "./types";

/**
 * Esqueleto BTP (AUTH_MODE=ias): a preencher quando existir approuter com
 * SAP IAS/XSUAA. Vai ler o utilizador e os papéis do token propagado pelo
 * approuter (cabeçalho x-forwarded-user / claims do JWT), nunca de um
 * seletor local. Ver docs/migracao-btp.md para o mapeamento de rotas e
 * papéis (EMPLOYEE/ADMIN) na xs-app.json.
 */
export default class IasAuthService implements IAuthService {
    public async getCurrentUser(): Promise<CurrentUser> {
        throw new Error("IasAuthService.getCurrentUser: por implementar na migração para SAP BTP.");
    }

    public async hasRole(_role: UserRole): Promise<boolean> {
        throw new Error("IasAuthService.hasRole: por implementar na migração para SAP BTP.");
    }

    public async getPermissions(): Promise<UserRole[]> {
        throw new Error("IasAuthService.getPermissions: por implementar na migração para SAP BTP.");
    }
}
