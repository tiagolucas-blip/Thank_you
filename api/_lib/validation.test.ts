import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNotSelfRecognition, assertValidSubmission, ValidationError } from "./validation.ts";
import type { RecognitionSubmission } from "./types.ts";

function validSubmission(overrides: Partial<RecognitionSubmission> = {}): RecognitionSubmission {
    return {
        authorId: "00000001",
        recipientId: "00000002",
        isAnonymous: false,
        message: "Mensagem válida.",
        categoryRatings: [{ categoryId: "CAT001", rating: 5 }],
        closedAnswers: [],
        ...overrides
    };
}

test("requisito 5 — assertNotSelfRecognition rejeita autor igual ao destinatário", () => {
    assert.throws(() => assertNotSelfRecognition("00000001", "00000001"), ValidationError);
});

test("requisito 5 — assertNotSelfRecognition aceita autor diferente do destinatário", () => {
    assert.doesNotThrow(() => assertNotSelfRecognition("00000001", "00000002"));
});

test("requisito 5 — assertValidSubmission rejeita auto-elogio mesmo com o resto do payload válido", () => {
    assert.throws(() => assertValidSubmission(validSubmission({ recipientId: "00000001" })), ValidationError);
});

test("assertValidSubmission rejeita classificação fora do intervalo 1-5", () => {
    assert.throws(
        () => assertValidSubmission(validSubmission({ categoryRatings: [{ categoryId: "CAT001", rating: 6 }] })),
        ValidationError
    );
});

test("assertValidSubmission aceita um payload válido", () => {
    assert.doesNotThrow(() => assertValidSubmission(validSubmission()));
});
