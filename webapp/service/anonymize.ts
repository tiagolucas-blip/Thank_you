import type { Employee, RecognitionAuthorView } from "./types";

/**
 * Requisito 4 — usada só pela implementação mock (webapp/service/mock),
 * que corre inteiramente no browser sem passar pelo serviço Vercel.
 * Duplica a decisão de api/_lib/anonymize.ts pela mesma razão da
 * validação: cada implementação de DATA_SOURCE tem de impor a regra
 * por si própria, nunca delegada à view.
 */
export function toAuthorView(employee: Employee | undefined, isAnonymous: boolean): RecognitionAuthorView | null {
    if (isAnonymous || !employee) {
        return null;
    }
    return { id: employee.id, name: employee.name, photoUrl: employee.photoUrl };
}
