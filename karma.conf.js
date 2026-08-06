module.exports = function (config) {
    config.set({
        frameworks: ["ui5"],
        ui5: {
            url: "https://ui5.sap.com",
            mode: "script",
            config: {
                async: true,
                language: "en",
                theme: "sap_horizon"
            },
            testpage: "test/unit/unitTests.qunit.html"
        },
        browsers: ["ChromeHeadless"],
        singleRun: true,
        reporters: ["progress"]
    });
};
