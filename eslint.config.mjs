import tseslint from "typescript-eslint";
import ui5Plugin from "eslint-plugin-ui5";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
    {
        ignores: ["dist/**", "webapp/resources/**", "webapp/test-resources/**", "node_modules/**"]
    },
    {
        files: ["webapp/**/*.ts"],
        extends: [...tseslint.configs.recommended],
        plugins: {
            ui5: ui5Plugin
        },
        languageOptions: {
            globals: {
                ...globals.browser
            }
        },
        rules: {
            "ui5/no-global-id": "error",
            "ui5/no-global-name": "error",
            "ui5/no-for-in": "error",
            "ui5/no-boolean-literal-compare": "warn",
            "no-console": "warn"
        }
    },
    {
        files: ["test/**/*.js"],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.qunit,
                sap: "readonly"
            }
        }
    },
    prettierConfig
);
