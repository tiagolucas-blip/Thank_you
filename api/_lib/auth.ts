import type { VercelRequest } from "@vercel/node";
import type { UserRole } from "./types.ts";
import { findEmployeeById } from "./store.ts";

export class AuthorizationError extends Error {
    public readonly code: string;

    constructor(code: string, message: string) {
        super(message);
        this.name = "AuthorizationError";
        this.code = code;
    }
}

export interface RequestUser {
    employeeId: string;
    role: UserRole;
}

/**
 * Implementação Vercel do AuthService ao nível do serviço: lê o
 * utilizador simulado enviado pelo seletor de demonstração (webapp/service)
 * via cabeçalhos HTTP. Em BTP este ficheiro é substituído pela leitura do
 * token SAP IAS via approuter — ver docs/migracao-btp.md. O contrato
 * (RequestUser, requireRole) mantém-se igual.
 */
export function getRequestUser(req: VercelRequest): RequestUser {
    const employeeId = req.headers["x-demo-user-id"];
    const role = req.headers["x-demo-role"];

    if (typeof employeeId !== "string" || (role !== "EMPLOYEE" && role !== "ADMIN")) {
        throw new AuthorizationError("demoUserInvalid", "Utilizador de demonstração em falta ou inválido.");
    }

    if (!findEmployeeById(employeeId)) {
        throw new AuthorizationError("demoUserUnknown", "Utilizador de demonstração desconhecido.");
    }

    return { employeeId, role };
}

/**
 * Requisito 10 — a verificação de autorização acontece sempre no serviço,
 * nunca só na view (esconder um botão não é controlo de acesso).
 */
export function requireRole(user: RequestUser, role: UserRole): void {
    if (user.role !== role) {
        throw new AuthorizationError(`${role.toLowerCase()}RoleRequired`, `Esta operação requer o papel ${role}.`);
    }
}
