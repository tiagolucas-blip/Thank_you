import { test } from "node:test";
import assert from "node:assert/strict";
import { toRecognitionRecordView } from "./anonymize.ts";
import type { Employee, RecognitionRecord } from "./types.ts";

const author: Employee = {
    id: "00000001",
    name: "Ana Ferreira",
    orgArea: "Vendas",
    photoUrl: "",
    email: "ana.ferreira@xpto.example",
    managerId: null,
    active: true
};
const employeesById = new Map<string, Employee>([[author.id, author]]);

function baseRecord(overrides: Partial<RecognitionRecord> = {}): RecognitionRecord {
    return {
        id: "REC0001",
        authorId: author.id,
        recipientId: "00000002",
        isAnonymous: false,
        message: "Mensagem de teste.",
        categoryRatings: [{ categoryId: "CAT001", rating: 5 }],
        closedAnswers: [],
        overallRating: 5,
        createdAt: "2026-01-01T00:00:00Z",
        status: "SUBMITTED",
        ...overrides
    };
}

test("requisito 4 — authorId nunca é serializado quando isAnonymous=true", () => {
    const record = baseRecord({ isAnonymous: true });
    const view = toRecognitionRecordView(record, employeesById);

    assert.strictEqual(view.author, null);
    assert.strictEqual(view.isAnonymous, true);
    assert.ok(!JSON.stringify(view).includes(author.id), "o id do autor não aparece na serialização");
});

test("requisito 4 — author é populado quando isAnonymous=false", () => {
    const record = baseRecord({ isAnonymous: false });
    const view = toRecognitionRecordView(record, employeesById);

    assert.strictEqual(view.author?.id, author.id);
    assert.strictEqual(view.author?.name, author.name);
});

test("record.authorId (armazenamento) mantém-se sempre, independentemente de isAnonymous", () => {
    const record = baseRecord({ isAnonymous: true });
    assert.strictEqual(record.authorId, author.id, "o storage nunca apaga authorId — só a view o omite");
});
