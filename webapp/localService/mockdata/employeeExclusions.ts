// Duplicado deliberadamente de api/_data/*.json — usado só pela
// implementação mock (DATA_SOURCE=mock), que corre inteiramente no
// browser sem rede. webapp/ não pode depender de código de api/
// (CLAUDE.md secção 10); ambos os conjuntos de seed têm de ser mantidos
// alinhados manualmente enquanto não existir um backend real.
import type { EmployeeExclusion } from "../../service/types";

export const employeeExclusions: EmployeeExclusion[] = [
    {
        id: "EXC0001",
        employeeId: "00000012",
        reason: "Colaborador inativo — conta suspensa",
        createdBy: "00000011",
        createdAt: "2026-01-15T09:00:00Z",
        active: true
    }
];
