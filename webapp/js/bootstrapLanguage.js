/*
 * Escreve a própria tag de bootstrap UI5 com o idioma guardado
 * (webapp/service/LanguagePreference.ts, chave "thankyou.language" — tem
 * de corresponder aqui, não há forma de importar o módulo TS neste
 * ficheiro) já embutido em data-sap-ui-language. document.write() é a
 * única forma fiável de o fazer: durante a análise síncrona do <head>, a
 * tag de bootstrap seguinte ainda não existe no DOM (é só texto por
 * analisar) — modificar o seu atributo depois de criada
 * (nextElementSibling) não tem efeito, o UI5 já a leu antes disso.
 *
 * Ficheiro externo (não inline em index.html) de propósito: a CSP em
 * vercel.json usa script-src 'self' sem 'unsafe-inline' — um <script>
 * inline é bloqueado pelo browser e a app fica em branco, sem nenhum
 * erro visível além da consola (bug real encontrado em produção).
 *
 * A tag de fecho vai partida em duas strings concatenadas para o
 * analisador HTML não fechar este bloco a meio.
 */
(function () {
    var storedLanguage = window.localStorage.getItem("thankyou.language") || "pt";
    document.write(
        '<script id="sap-ui-bootstrap"' +
            ' src="resources/sap-ui-core.js"' +
            ' data-sap-ui-theme="sap_horizon"' +
            ' data-sap-ui-resource-roots=\'{"com.xpto.thankyou": "./"}\'' +
            ' data-sap-ui-on-init="module:sap/ui/core/ComponentSupport"' +
            ' data-sap-ui-compat-version="edge"' +
            ' data-sap-ui-async="true"' +
            ' data-sap-ui-frame-options="trusted"' +
            ' data-sap-ui-language="' +
            storedLanguage +
            '"><' +
            "/scr" +
            "ipt>"
    );
})();
