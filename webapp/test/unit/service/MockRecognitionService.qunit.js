sap.ui.define(
    [
        "sap/ui/thirdparty/qunit-2",
        "com/xpto/thankyou/service/mock/MockRecognitionService",
        "com/xpto/thankyou/service/DemoUserStore"
    ],
    function (QUnit, MockRecognitionService, DemoUserStore) {
        "use strict";

        QUnit.module("service/mock/MockRecognitionService — requisitos 4 e 5", {
            beforeEach: function () {
                DemoUserStore.setCurrentDemoIdentity("00000001");
            }
        });

        QUnit.test("requisito 5 — rejeita a submissão de um reconhecimento a si próprio", function (assert) {
            var done = assert.async();
            var service = new MockRecognitionService();

            service
                .submitRecognition({
                    recipientId: "00000001",
                    isAnonymous: false,
                    message: "Não devia ser possível.",
                    categoryRatings: [{ categoryId: "CAT001", rating: 5 }],
                    closedAnswers: []
                })
                .then(
                    function () {
                        assert.ok(false, "a submissão devia ter sido rejeitada");
                        done();
                    },
                    function (error) {
                        assert.ok(error instanceof Error, "rejeita com um erro");
                        done();
                    }
                );
        });

        QUnit.test("requisito 4 — oculta o autor quando isAnonymous=true na leitura", function (assert) {
            var done = assert.async();
            var service = new MockRecognitionService();

            service
                .submitRecognition({
                    recipientId: "00000002",
                    isAnonymous: true,
                    message: "Mensagem anónima de teste.",
                    categoryRatings: [{ categoryId: "CAT001", rating: 4 }],
                    closedAnswers: []
                })
                .then(function (result) {
                    assert.strictEqual(result.isAnonymous, true, "confirmação reflete isAnonymous");
                    return service.getReceivedRecognitions("00000002");
                })
                .then(function (received) {
                    var created = received.filter(function (entry) {
                        return entry.message === "Mensagem anónima de teste.";
                    })[0];
                    assert.ok(created, "o registo aparece na leitura do destinatário");
                    assert.strictEqual(created && created.author, null, "author é null quando anónimo");
                    assert.strictEqual(
                        created && created.isAnonymous,
                        true,
                        "isAnonymous mantém-se true na vista de leitura"
                    );
                    assert.notOk(
                        JSON.stringify(created).indexOf("00000001") !== -1,
                        "o id do autor (00000001) não é serializado na vista pública"
                    );
                    done();
                });
        });

        QUnit.test("requisito 4 — mostra o autor quando isAnonymous=false na leitura", function (assert) {
            var done = assert.async();
            var service = new MockRecognitionService();

            service
                .submitRecognition({
                    recipientId: "00000003",
                    isAnonymous: false,
                    message: "Mensagem identificada de teste.",
                    categoryRatings: [{ categoryId: "CAT001", rating: 4 }],
                    closedAnswers: []
                })
                .then(function () {
                    return service.getReceivedRecognitions("00000003");
                })
                .then(function (received) {
                    var created = received.filter(function (entry) {
                        return entry.message === "Mensagem identificada de teste.";
                    })[0];
                    assert.ok(created, "o registo aparece na leitura do destinatário");
                    assert.strictEqual(
                        created && created.author && created.author.id,
                        "00000001",
                        "author identifica o autor real quando não é anónimo"
                    );
                    done();
                });
        });
    }
);
