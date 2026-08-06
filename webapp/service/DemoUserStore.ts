import type { Employee, UserRole } from "./types";

export interface DemoIdentity {
    employee: Employee;
    role: UserRole;
}

const STORAGE_KEY = "thankyou.demoUser";

/**
 * As duas identidades fixas do "seletor de utilizador simulado"
 * (CLAUDE.md secção 6, AUTH_MODE=demo) — espelham exatamente os
 * colaboradores 00000001 e 00000011 em api/_data/employees.json.
 * Mantidas aqui em duplicado (não importadas de api/) para que
 * getCurrentUser() resolva a identidade sem precisar de uma chamada de
 * rede nem de expor um endpoint "quem sou eu" adicional.
 */
export const DEMO_IDENTITIES: DemoIdentity[] = [
    {
        role: "EMPLOYEE",
        employee: {
            id: "00000001",
            name: "Ana Ferreira",
            orgArea: "Vendas",
            photoUrl: "",
            email: "ana.ferreira@xpto.example",
            managerId: "00000009",
            active: true
        }
    },
    {
        role: "ADMIN",
        employee: {
            id: "00000011",
            name: "Leonor Cardoso",
            orgArea: "Recursos Humanos",
            photoUrl: "",
            email: "leonor.cardoso@xpto.example",
            managerId: null,
            active: true
        }
    }
];

export function getCurrentDemoIdentity(): DemoIdentity {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
        const storedEmployeeId = JSON.parse(stored) as { employeeId: string };
        const found = DEMO_IDENTITIES.find((identity) => identity.employee.id === storedEmployeeId.employeeId);
        if (found) {
            return found;
        }
    }
    return DEMO_IDENTITIES[0];
}

export function setCurrentDemoIdentity(employeeId: string): void {
    const identity = DEMO_IDENTITIES.find((candidate) => candidate.employee.id === employeeId);
    if (!identity) {
        throw new Error(`Identidade de demonstração desconhecida: ${employeeId}`);
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ employeeId }));
}
