// Duplicado deliberadamente de api/_data/recognitionCategories.json — ver
// nota em employees.ts.
import type { RecognitionCategory } from "../../service/types";

export const recognitionCategoriesFlat: RecognitionCategory[] = [
    {
        id: "CAT001",
        code: "PERFORMANCE",
        labelKey: "categoryPerformance",
        parentCategoryId: null,
        order: 1,
        active: true
    },
    {
        id: "CAT002",
        code: "RESPONSIBILITY",
        labelKey: "categoryResponsibility",
        parentCategoryId: null,
        order: 2,
        active: true
    },
    {
        id: "CAT003",
        code: "TEAM_SPIRIT",
        labelKey: "categoryTeamSpirit",
        parentCategoryId: null,
        order: 3,
        active: true
    },
    {
        id: "CAT004",
        code: "PROACTIVITY",
        labelKey: "categoryProactivity",
        parentCategoryId: null,
        order: 4,
        active: true
    },
    {
        id: "CAT005",
        code: "ORGANIZATION",
        labelKey: "categoryOrganization",
        parentCategoryId: null,
        order: 5,
        active: true
    },
    {
        id: "CAT006",
        code: "TEAM_SPIRIT_CROSS_TEAM",
        labelKey: "categoryTeamSpiritCrossTeam",
        parentCategoryId: "CAT003",
        order: 1,
        active: true
    }
];
