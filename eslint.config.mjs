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
            },
            parserOptions: {
                project: ["./tsconfig.json"],
                tsconfigRootDir: import.meta.dirname
            }
        },
        rules: {
            "ui5/no-global-id": "error",
            "ui5/no-global-name": "error",
            "ui5/no-for-in": "error",
            "ui5/no-boolean-literal-compare": "warn",
            "no-console": "warn",
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
            // Regras conscientes de tipos, ligadas cirurgicamente (não o
            // preset recommendedTypeChecked completo): apanham promises
            // esquecidas sem .catch nem "void" explícito — a classe de bug
            // encontrada na auditoria (pesquisas "ao vivo" sem tratamento
            // de erro). "void expr" continua aceite como descarte
            // intencional (ignoreVoid é o default desta regra).
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/no-misused-promises": "error"
        }
    },
    {
        files: ["api/**/*.ts"],
        extends: [...tseslint.configs.recommended],
        languageOptions: {
            globals: {
                ...globals.node
            },
            parserOptions: {
                project: ["./tsconfig.api.json"],
                tsconfigRootDir: import.meta.dirname
            }
        },
        rules: {
            "no-console": "warn",
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/no-misused-promises": "error"
        }
    },
    {
        files: ["webapp/test/**/*.js"],
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
