# Análise Funcional — Thank You

Plataforma de reconhecimento público entre colaboradores. Cliente fictício de referência nesta documentação: **XPTO**. Nenhum nome de cliente real, marca, ou pessoa real é usado em qualquer artefacto deste repositório.

## 1. Objetivos de negócio

- Fomentar cultura de reconhecimento e meritocracia, aumentar motivação.
- Dar visibilidade a contributos que passam despercebidos.
- Automatizar notificações de agradecimento e incentivar reciprocidade.
- Integrar com sistemas internos: email, intranet, Microsoft Teams.

## 2. Fase atual vs. destino

|                    | Fase atual                                | Destino                             |
| ------------------ | ----------------------------------------- | ----------------------------------- |
| Hosting            | Vercel                                    | SAP BTP Cloud Foundry               |
| Backend de pessoas | Mock / Vercel Functions                   | SAP SuccessFactors Employee Central |
| Integração         | Vercel Functions (`/api`) a imitar iFlows | SAP Integration Suite               |
| Autenticação       | Seletor de utilizador simulado            | SAP IAS (SSO)                       |

**Regra número um:** a app corre e é demonstrável em Vercel já; nenhuma decisão técnica pode bloquear a migração para BTP. Cada serviço BTP indisponível em Vercel fica atrás de uma abstração com implementação Vercel (simulada) e esqueleto BTP, selecionada por `DATA_SOURCE` / variável de ambiente — nunca chamado diretamente por controllers.

## 3. Perfis e permissões

- **EMPLOYEE**: vê landing page, submete reconhecimentos, consulta a sua área e os contadores públicos.
- **ADMIN**: tudo o que EMPLOYEE vê, mais o dashboard `#/admin`.

O modelo de permissões vem do backend (`AuthService.hasRole()`), nunca decidido só na view — esconder um botão não é controlo de acesso; a verificação repete-se no serviço.

## 4. Requisitos funcionais

Numeração mantida conforme a proposta original. **Não existe requisito 3** — lacuna assinalada, não renumerada.

| #   | Requisito                                         | Nota de implementação                                                                                                   | Fase |
| --- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---- |
| 1   | Pesquisa do colaborador a reconhecer              | Lista de colaboradores do backend, com `EmployeeExclusion` aplicada no serviço (não só filtrada na UI)                  | 3, 5 |
| 2   | Submissão de agradecimentos                       | Formulário com categorias/subcategorias vindas de `RecognitionCategory`                                                 | 5    |
| —   | _(lacuna — sem requisito 3 na proposta)_          | —                                                                                                                       | —    |
| 4   | Anonimização do reconhecimento                    | Checkbox no formulário; `authorId` persiste sempre, nunca serializado quando `isAnonymous=true` — ver `modelo-dados.md` | 3    |
| 5   | Impossibilidade de auto-elogio                    | Validação em frontend E no serviço (regra só em frontend é contornável)                                                 | 3, 5 |
| 6   | Notificações automáticas por email                | `NotificationMetadata` configurável; em Vercel, stub que regista o payload em vez de enviar                             | 3, 7 |
| 7   | Visibilidade do nº de agradecimentos para todos   | Contadores agregados públicos, endpoint próprio                                                                         | 4, 6 |
| 8   | Ranking "Top Performers"                          | Top 5 por nº de reconhecimentos + classificação média                                                                   | 4, 6 |
| 9   | Integração com sistemas internos                  | Email (SMTP stub), link de acesso a partir da intranet, Teams (Adaptive Card stub)                                      | 7    |
| 10  | Gestão de perfis de permissão e visibilidades     | EMPLOYEE / ADMIN, modelo vem do backend                                                                                 | 2, 3 |
| 11  | Relatórios de utilização e métricas de engagement | OpenTelemetry desde o início                                                                                            | 7    |
| 12  | Persistência do registo de reconhecimento         | `RecognitionRecord`, backend de RH (mock/Vercel nesta fase)                                                             | 3    |

## 5. Ecrãs

### 5.1 Landing page (`/`)

Header (app, utilizador, papel, avatar) · Top Performers (5 cartões horizontais: avatar, nome, `X.X/5`, nº reconhecimentos) · "A minha área" (3 KPIs + botão "Enviar reconhecimento") · duas listas pesquisáveis lado a lado (Recebidas / Atribuídas), empilhadas em ecrã pequeno via `sap.f.GridContainer`/`sap.ui.layout.Grid`.

Quando anónimo: autor mostra "Anónimo" com avatar neutro — decidido no serviço, nunca a view a esconder o nome.

### 5.2 Dialog "Novo reconhecimento"

Pesquisa de colaborador (o próprio utilizador nunca aparece nos resultados) · filtro por área · `IconTabBar` de categorias configuráveis (`RecognitionCategory`) · por categoria: `RatingIndicator` (5 estrelas) + observações + questões fechadas (`ClosedQuestion`) associadas a essa categoria · mensagem final com contador de caracteres · checkbox "Marcar como anónimo" · validação inline, sem `MessageBox` genérico.

**Decisão confirmada:** `ClosedQuestion` entra por categoria, dentro do dialog — cada tab de categoria pode ter, além do rating, um conjunto de questões fechadas configuráveis (sim/não ou escolha simples).

### 5.3 Dashboard de Administrador (`#/admin`, só ADMIN)

3 KPIs (Total Reconhecimentos, Média total, Utilizadores ativos) · Top Performers em cartões verticais · gráfico de anel de categorias mais bem avaliadas · tabela dos últimos reconhecimentos com pesquisa · gráfico de barras por mês com seletor de ano.

## 6. Decisões de arquitetura confirmadas

- **Repositório**: `tiagolucas-blip/thank_you`, dedicado a esta aplicação — não partilha código com o `scheduling_tool` (Pitstop/Next.js).
- **Padrão UI5**: Freestyle (views XML, MVC, routing por hash), não Fiori Elements. Nenhum dos três ecrãs é List Report/Object Page padrão; Fiori Elements exigiria anotações OData completas já em Vercel (onde a camada de dados é `mock`/`vercel-api`, não OData) e extensões custom pesadas em cada floorplan, sem ganho de produtividade. Ver avaliação completa no histórico de decisão (secção 6 mantém-se como registo).
- **Métrica "Média de reconhecimento" (%)**: normalizada a partir da classificação 1–5 estrelas: `percentagem = (classificaçãoMédia / 5) × 100`. O cartão Top Performers mostra a mesma classificação em formato `X.X/5` (não convertida); o KPI "A minha área" mostra-a em `%`. Mesma fonte de dados, duas formatações.
- **Localização dos testes**: `webapp/test/unit/` e `webapp/test/integration/`, não `test/` de topo como descrito na secção 7 original. `karma-ui5` (tooling de testes UI5, secção 6) só serve automaticamente ficheiros dentro de `webapp/` para projetos `type: application` — um `test/` fora de `webapp/` fica sem transpilação TypeScript nem serving correto, confirmado empiricamente. Mantém a convenção standard das apps UI5. Sinalizado aqui por ser um desvio deliberado à estrutura da secção 7.
- **`DATA_SOURCE`/`AUTH_MODE` em runtime**: como a SPA é estática (sem servidor a cada pedido), estas variáveis de ambiente são lidas uma vez em build-time por `scripts/generate-runtime-config.mjs` (corre antes de `start`/`build`/`test`/`postinstall`) e gravadas em `webapp/service/runtimeConfig.generated.ts`. É o único ponto do projeto onde uma variável de ambiente de plataforma entra no bundle da SPA — a seleção de implementação em si continua centralizada em `ServiceFactory.ts`/`AuthServiceFactory.ts`, nunca em controllers.
- **Stub de notificações (requisito 6)**: em vez de `console.log`, o payload "enviado" fica num registo em memória (`api/_lib/store.ts#listDispatchedNotifications`), exposto só a ADMIN via `GET /api/notifications` — inspecionável na demo sem depender dos logs efémeros da função serverless.
- **Erros do serviço como códigos, não mensagens (Fase 7)**: `ValidationError`/`AuthorizationError` (`api/_lib/`) e `ServiceError` (`webapp/service/errors.ts`, usado por `MockRecognitionService` e `VercelApiRecognitionService`) passaram a expor um `code` estável em inglês (ex.: `selfRecognitionNotAllowed`, `categoryRatingRange`, `adminRoleRequired`) em vez da mensagem PT anterior. O texto PT continua a existir só para logs de servidor (`error.message`, nunca enviado ao cliente). `NewRecognitionDialog.onSubmitPress` mapeia o código para uma chave i18n antes de mostrar o `MessageToast` — a versão anterior mostrava `error.message` diretamente, o que ignorava o idioma ativo (bug real corrigido nesta fase, não só um "polish").
- **Telemetria — SDK real no servidor, hand-rolled no browser (Fase 7, requisito 11)**: a primeira tentativa importou `@opentelemetry/api`/`sdk-trace-base` diretamente em `webapp/service/telemetry/`, mas partiu a app: o carregador de módulos AMD do UI5 (`sap.ui.define`, via `ui5-tooling-transpile`) não resolve pacotes npm arbitrários em runtime — confirmado com um erro real (`ModuleError: Failed to resolve dependencies`, a pedir `resources/@opentelemetry/api.js`, inexistente) ao correr a app no browser. `api/_lib/telemetry.ts` (Vercel Functions, Node puro, fora do carregador UI5) mantém o SDK OpenTelemetry real. `webapp/service/telemetry/ConsoleTelemetryService.ts` foi reescrito sem dependências, registando spans no mesmo formato semântico (nome, atributos, estado) via `console.info`. O contrato `ITelemetryService` e os pontos de instrumentação (vista de página, pesquisa de colaborador, submissão, erros) não mudam; `TELEMETRY_MODE` (`console`/`otel-collector`, derivado de `OTEL_EXPORTER_OTLP_ENDPOINT` no build) segue o mesmo padrão de `DATA_SOURCE`/`AUTH_MODE`. Na migração para BTP, o lado browser passa a usar `@opentelemetry/sdk-trace-web` com um bundle próprio (webpack/esbuild), fora do `ui5 build` desta fase — ver `docs/migracao-btp.md`.
- **Nome acessível em controlos gerados por template (Fase 7, WCAG 2.1 AA)**: `RatingIndicator`/`TextArea`/`Select` dentro de agregações com `items="{...}"` (categorias e questões fechadas no dialog "Novo reconhecimento") não têm `id` próprio nem podem usar `labelFor`/`ariaLabelledBy` a apontar para um `Label` específico. Usa-se `tooltip` (bound à categoria/questão) como nome acessível de recurso — padrão já usado nos gráficos SVG da Fase 6 para a alternativa textual.

## 7. Perguntas em aberto

| #   | Pergunta                                                                                                | Assunção de trabalho (a confirmar)                                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | O dashboard de administrador deve ser filtrável por período arbitrário, ou só por ano (como no mockup)? | Assumido **só por ano** nesta fase, para corresponder ao mockup; filtro por período fica anotado como extensão futura em `rastreabilidade-requisitos.md`. Avisar se deve ser já implementado. |

Todas as restantes perguntas da proposta original (padrão UI5, terceira view, questões fechadas, métrica %, repositório) estão respondidas na secção 6.
