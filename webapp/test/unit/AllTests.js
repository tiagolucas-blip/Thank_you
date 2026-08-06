sap.ui.require(["sap/ui/thirdparty/qunit-2"], function () {
    // Impede o QUnit de arrancar antes de todos os módulos de teste
    // estarem registados (evita corrida entre o autostart do QUnit e o
    // carregamento assíncrono dos módulos abaixo).
    QUnit.config.autostart = false;

    sap.ui.require(
        [
            "com/xpto/thankyou/test/unit/service/validation.qunit",
            "com/xpto/thankyou/test/unit/service/MockRecognitionService.qunit"
            // Testes adicionais (dialog, dashboard, ...) entram aqui a partir da Fase 5/6.
        ],
        function () {
            QUnit.start();
        }
    );
});
