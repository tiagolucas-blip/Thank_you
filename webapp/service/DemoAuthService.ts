import type IAuthService from "./IAuthService";
import type { CurrentUser } from "./IAuthService";
import type { UserRole } from "./types";
import { getCurrentDemoIdentity } from "./DemoUserStore";

/**
 * Implementação Vercel do AuthService (AUTH_MODE=demo): seletor de
 * utilizador simulado, alterna entre um EMPLOYEE e um ADMIN para
 * demonstrar os dois ecrãs. A UI (Fase 4) tem de deixar claro que este é
 * modo de demonstração, nunca autenticação real.
 */
export default class DemoAuthService implements IAuthService {
    public async getCurrentUser(): Promise<CurrentUser> {
        const identity = getCurrentDemoIdentity();
        return { employee: identity.employee, role: identity.role };
    }

    public async hasRole(role: UserRole): Promise<boolean> {
        const identity = getCurrentDemoIdentity();
        return identity.role === role;
    }

    public async getPermissions(): Promise<UserRole[]> {
        const identity = getCurrentDemoIdentity();
        return identity.role === "ADMIN" ? ["EMPLOYEE", "ADMIN"] : ["EMPLOYEE"];
    }
}
