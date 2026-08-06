import type { Employee, UserRole } from "./types";

export interface CurrentUser {
    employee: Employee;
    role: UserRole;
}

/**
 * Interface única de autenticação/autorização (CLAUDE.md secção 6).
 * As verificações de autorização que importam acontecem sempre no
 * IRecognitionService (ou na API), nunca só aqui — esconder um botão
 * com hasRole() não é controlo de acesso.
 */
export default interface IAuthService {
    getCurrentUser(): Promise<CurrentUser>;
    hasRole(role: UserRole): Promise<boolean>;
    getPermissions(): Promise<UserRole[]>;
}
