# Thank You (mockup XPTO)

Plataforma de reconhecimento público entre colaboradores. Mockup navegável em OpenUI5, destinado a evoluir para SAP BTP Cloud Foundry (SuccessFactors Employee Central, Integration Suite, IAS). Nesta fase corre em Vercel com dados fictícios.

Cliente de referência nesta documentação e nos dados de seed: **XPTO** (fictício). Ver `docs/analise-funcional.md` para contexto funcional completo e `docs/modelo-dados.md` para o modelo de dados.

## Stack

- OpenUI5 1.151.0 (versão fixa, pacotes `@openui5/*`), Freestyle (views XML, MVC, routing por hash).
- TypeScript em modo strict, `ui5-tooling-transpile` para build/serve.
- `@ui5/cli` 4.x, `ui5.yaml` em `specVersion: "4.0"`.
- Vercel Functions em `/api`, espelhando os futuros iFlows do SAP Integration Suite.
- ESLint (`eslint-plugin-ui5`) + Prettier, QUnit + OPA5 para testes.

> **Nota:** `karma-ui5` está deprecado a montante (sem sucessor único indicado — o projeto aponta para os pacotes de testing da comunidade UI5). Mantido nesta fase por ser a opção mais documentada; a reavaliar quando a Fase 7/8 escrever os journeys OPA5 reais.

## Requisitos

- Node.js ≥ 20.

## Desenvolvimento local

```bash
npm install
npm start        # ui5 serve, abre index.html
npm run lint      # eslint
npm run ts:check  # tsc --noEmit
npm run build     # ui5 build --all --clean-dest → dist/
npm test          # karma + qunit (a partir da Fase 3 tem testes reais)
```

## Variáveis de ambiente

Ver `.env.example`. Nenhum segredo em código — tudo lido por variável de ambiente, com a app a nunca chamar plataforma diretamente a partir de controllers (sempre através de `webapp/service/`).

## Deploy em Vercel

- Build: `npm run build` (output `dist/`).
- Funções serverless em `/api`.
- `vercel.json` define cabeçalhos de segurança (CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`) e cache longo para `resources/**` vs. curto para `index.html`/`manifest.json`.
- **Nota sobre CSP**: `style-src` inclui `'unsafe-inline'` porque o OpenUI5 define estilos inline diretamente nos elementos DOM durante a renderização de controlos — não há alternativa sem reescrever o motor de renderização da framework. `script-src` **não** inclui `'unsafe-eval'`: não é necessário para esta aplicação.
- **Importante**: ativa a [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection) neste projeto. Este deployment não deve ficar acessível publicamente — é um mockup de demonstração com dados fictícios, mas ainda assim não é para expor sem proteção.

## Documentação

- `docs/analise-funcional.md` — requisitos, ecrãs, decisões de arquitetura.
- `docs/modelo-dados.md` — entidades, diagrama Mermaid, regras de anonimato e auto-elogio.
- `docs/migracao-btp.md` — plano de migração para SAP BTP (chega na fase final).
- `docs/rastreabilidade-requisitos.md` — rastreabilidade requisito → implementação → testes (chega na fase final).
