sap.ui.define(["sap/ui/thirdparty/qunit-2", "com/xpto/thankyou/service/validation"], function (QUnit, validation) {
    "use strict";

    var isSelfRecognition = validation.isSelfRecognition;
    var validateRecognitionForm = validation.validateRecognitionForm;

    QUnit.module("service/validation — requisito 5 (auto-elogio)");

    QUnit.test("isSelfRecognition deteta autor igual ao destinatário", function (assert) {
        assert.strictEqual(isSelfRecognition("00000001", "00000001"), true, "mesmo id => auto-elogio");
        assert.strictEqual(isSelfRecognition("00000001", "00000002"), false, "ids diferentes => não é auto-elogio");
    });

    QUnit.test("validateRecognitionForm rejeita auto-elogio mesmo com o resto do formulário válido", function (assert) {
        var result = validateRecognitionForm({
            authorId: "00000001",
            recipientId: "00000001",
            message: "Mensagem válida.",
            categoryRatings: [{ rating: 5 }]
        });

        assert.strictEqual(result.valid, false, "formulário inválido");
        assert.strictEqual(result.errors.recipientId, "selfRecognitionNotAllowed", "erro específico de auto-elogio");
    });

    QUnit.test("validateRecognitionForm aceita um reconhecimento válido a outro colaborador", function (assert) {
        var result = validateRecognitionForm({
            authorId: "00000001",
            recipientId: "00000002",
            message: "Mensagem válida.",
            categoryRatings: [{ rating: 5 }]
        });

        assert.strictEqual(result.valid, true, "formulário válido");
        assert.deepEqual(result.errors, {}, "sem erros");
    });
});
