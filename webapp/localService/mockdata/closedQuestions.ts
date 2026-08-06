// Duplicado deliberadamente de api/_data/*.json — usado só pela
// implementação mock (DATA_SOURCE=mock), que corre inteiramente no
// browser sem rede. webapp/ não pode depender de código de api/
// (CLAUDE.md secção 10); ambos os conjuntos de seed têm de ser mantidos
// alinhados manualmente enquanto não existir um backend real.
import type { ClosedQuestion } from "../../service/types";

export const closedQuestions: ClosedQuestion[] = [
    {
        id: "CQ001",
        categoryId: "CAT001",
        code: "MET_GOALS",
        labelKey: "closedQuestionMetGoals",
        answerType: "BOOLEAN",
        options: [],
        order: 1,
        active: true
    },
    {
        id: "CQ002",
        categoryId: "CAT003",
        code: "COLLAB_FREQUENCY",
        labelKey: "closedQuestionCollabFrequency",
        answerType: "SINGLE_CHOICE",
        options: ["OCCASIONAL", "REGULAR", "CONSTANT"],
        order: 1,
        active: true
    }
];
