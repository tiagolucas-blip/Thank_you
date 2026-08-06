import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRequestUser } from "./_lib/auth.ts";
import { sendError, sendJson } from "./_lib/http.ts";
import { listActiveExclusionIds, listEmployees } from "./_lib/store.ts";

/**
 * Requisito 1 — pesquisa do colaborador a reconhecer. Aplica a
 * EmployeeExclusion sempre aqui no serviço (nunca só filtrada na UI) e
 * exclui sempre o próprio utilizador autenticado dos resultados.
 */
export default function handler(req: VercelRequest, res: VercelResponse): void {
    try {
        const user = getRequestUser(req);
        const search = typeof req.query.search === "string" ? req.query.search.trim().toLowerCase() : "";
        const orgArea = typeof req.query.orgArea === "string" ? req.query.orgArea : "";
        const excludedIds = listActiveExclusionIds();

        const employees = listEmployees().filter((employee) => {
            if (employee.id === user.employeeId) {
                return false;
            }
            if (!employee.active || excludedIds.has(employee.id)) {
                return false;
            }
            if (orgArea && employee.orgArea !== orgArea) {
                return false;
            }
            if (search && !employee.name.toLowerCase().includes(search)) {
                return false;
            }
            return true;
        });

        sendJson(res, 200, { employees });
    } catch (error) {
        sendError(res, error);
    }
}
