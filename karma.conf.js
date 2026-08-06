const { existsSync, readdirSync } = require("node:fs");
const { join } = require("node:path");

// Só define CHROME_BIN se ainda não estiver definido e existir um Chromium
// pré-instalado sob /opt/pw-browsers (ambiente de sandbox/CI específico
// deste projeto). Em qualquer outra máquina, karma-chrome-launcher deteta
// o Chrome instalado normalmente sem precisar disto.
if (!process.env.CHROME_BIN && existsSync("/opt/pw-browsers")) {
    const chromiumDir = readdirSync("/opt/pw-browsers").find((name) => /^chromium-\d+$/.test(name));
    if (chromiumDir) {
        const candidate = join("/opt/pw-browsers", chromiumDir, "chrome-linux", "chrome");
        if (existsSync(candidate)) {
            process.env.CHROME_BIN = candidate;
        }
    }
}

module.exports = function (config) {
    config.set({
        basePath: __dirname,
        frameworks: ["ui5"],
        ui5: {
            type: "application",
            mode: "html",
            testpage: "webapp/test/unit/unitTests.qunit.html",
            failOnEmptyTestPage: true
        },
        browsers: ["ChromeHeadlessNoSandbox"],
        customLaunchers: {
            ChromeHeadlessNoSandbox: {
                base: "ChromeHeadless",
                flags: ["--no-sandbox", "--disable-gpu"]
            }
        },
        singleRun: true,
        reporters: ["progress"]
    });
};
