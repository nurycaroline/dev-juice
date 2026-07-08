# Unificação da Arquitetura de Webviews — Tasks

## Execution Protocol (MANDATORY — do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute
flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source
of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier,
discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/webview-architecture-unification/design.md`
**Status**: Draft (aguardando aprovação)

---

## Test Coverage Matrix

> Gerada a partir do codebase, diretrizes do projeto e spec — confirmar antes do Execute.
> Diretrizes encontradas: `COPILOT_INSTRUCTIONS.md` e `CONTRIBUTING.md` exigem "testes apropriados
> para novas funcionalidades" e uso de `npm run lint`/`npm run compile`, mas não definem tipos nem
> thresholds → **defaults fortes aplicados**. Não há nenhum teste existente no repositório; a infra
> (`vscode-test`, `@vscode/test-cli`, mocha) está declarada em `package.json` mas nunca foi usada.
> Tipos de teste assumidos (registrado na spec, Assumptions): unit + integration via a infra já
> declarada, sem dependências novas.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Utilitários puros (`securityUtils`, geradores CPF/CNPJ/UUID, `textFormatter`) | unit | Todos os branches; 1:1 com os ACs da spec que os referenciam | `src/test/unit/*.test.ts` | `npm test -- --label unit` |
| `toolRegistry` + teste de consistência (registro ↔ manifesto ↔ templates) | unit | Todas as regras de ARCH-06 (comando faltante, comando extra, template ausente) + caminho feliz | `src/test/unit/*.test.ts` | `npm test -- --label unit` |
| Validação de mensagens da `BaseWebviewPanel` (parte pura) | unit | Whitelist aceita/rejeita; payload não-string; payload > 100k; mensagem sem `command` (todos os edge cases listados na spec) | `src/test/unit/*.test.ts` | `npm test -- --label unit` |
| Ciclo de vida de painel (create/reveal/dispose/CSP) — extension host | integration | ACs 1–5 de ARCH-01 em painéis representativos (1 declarativo, 1 subclasse, 1 gerador) : happy + reveal + dispose + template ausente | `src/test/integration/*.test.ts` | `npm test -- --label integration` |
| `extension.ts` / `devJuiceProvider` (fiação derivada do registro) | integration | Ativação registra todos os comandos do registro; tree renderiza categorias/itens do registro; registro vazio não lança | `src/test/integration/*.test.ts` | `npm test -- --label integration` |
| Templates HTML (`src/templates/*.html`) | none | — (existência verificada pelo teste de consistência; gate de build) | — | build gate only |

## Gate Check Commands

> Gerados do codebase (`package.json` scripts) — confirmar antes do Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Após tarefas só com testes unit | `npm run compile && npm run lint && npm test -- --label unit` |
| Full | Após tarefas com testes integration | `npm run compile && npm run lint && npm test` |
| Build | Fim de fase ou tarefas sem teste próprio | `npm run compile && npm run lint && npm test` |

> Os labels `unit`/`integration` são definidos em `.vscode-test.mjs` na T1. Até a T1 existir, o gate
> é `npm run compile && npm run lint`.

---

## Execution Plan

Fases ordenadas e sequenciais — cada fase termina antes da próxima; tarefas em ordem dentro da fase.

### Phase 1: Fundação (infra de teste + segurança + registro)

```
T1 → T2 → T3 → T4
```

### Phase 2: Núcleo de painel

```
T5 → T6
```

### Phase 3: Migração — declarativos e fiação

```
T7 → T8
```

### Phase 4: Migração — subclasses com lógica no host

```
T9 → T10 → T11
```

### Phase 5: Tree view, código morto e manifesto

```
T12 → T13 → T14
```

**Total: 14 tarefas** → empacota em ~2 batches de sub-agentes (~7 tarefas cada: Fases 1–2 = 6
tarefas; Fases 3–5 = 8 tarefas). No Execute, apresentar a oferta de sub-agentes antes de iniciar.

---

## Task Breakdown

### T1: Ativar a infraestrutura de testes

**What**: Criar `.vscode-test.mjs` com dois labels (`unit`, `integration`), estrutura `src/test/{unit,integration}/`, e um teste smoke em cada label para provar o pipeline (ex.: unit valida `secureHash`; integration valida que a extensão ativa).
**Where**: `.vscode-test.mjs`, `src/test/unit/smoke.test.ts`, `src/test/integration/smoke.test.ts`, ajuste de `tsconfig.json`/`.vscodeignore` se necessário
**Depends on**: None
**Reuses**: `vscode-test`, `@vscode/test-cli`, `@types/mocha` já em `package.json`; script `"test": "vscode-test"` existente
**Requirement**: ARCH-07

**Tools**: MCP: NONE | Skill: NONE

**Done when**:

- [ ] `npm test` descobre e roda os 2 smokes com exit code 0
- [ ] `npm test -- --label unit` roda só o label unit
- [ ] Quebrar uma asserção de propósito → exit code ≠ 0 (verificado e revertido)
- [ ] Gate: `npm run compile && npm run lint && npm test`

**Tests**: unit + integration (smokes) | **Gate**: full
**Commit**: `test: ativar infraestrutura de testes com vscode-test (unit + integration)`

---

### T2: Nonce criptográfico + testes de `securityUtils`

**What**: Trocar `generateNonce` para `crypto.randomBytes`; escrever testes unit de `generateNonce` (≥32 chars alfanuméricos, unicidade), `sanitizeHTML` (5 entidades), `validateUserInput` (tipo, maxLength, pattern) e `secureHash`.
**Where**: `src/utils/securityUtils.ts` (modificar), `src/test/unit/securityUtils.test.ts` (novo)
**Depends on**: T1
**Reuses**: `crypto` já importado no módulo
**Requirement**: ARCH-09

**Tools**: MCP: NONE | Skill: NONE

**Done when**:

- [ ] `generateNonce` não usa `Math.random`; retorna ≥ 32 chars `[A-Za-z0-9]`
- [ ] Testes cobrem todos os branches dos 4 utilitários (AC1 de ARCH-09 asserido literalmente)
- [ ] Gate quick passa; contagem: ≥ 10 testes unit passam

**Tests**: unit | **Gate**: quick
**Commit**: `fix(security): nonce criptográfico via crypto.randomBytes + testes de securityUtils`

---

### T3: Criar `ToolDefinition` e `toolRegistry`

**What**: Criar `src/tools/toolRegistry.ts` com a interface `ToolDefinition` (design, Data Models) e as 36 entradas (ids de comando ATUAIS, sem renomear; títulos/ícones/categorias copiados de `devJuiceProvider.ts`/`package.json`; `factory` lazy para as ferramentas com lógica no host, ausente para declarativas). Testes unit de `getTools`/`getToolsByCategory`.
**Where**: `src/tools/toolRegistry.ts`, `src/test/unit/toolRegistry.test.ts`
**Depends on**: T1
**Reuses**: ids/títulos de `extension.ts`, `devJuiceProvider.ts`, `package.json`; padrão lazy `require` existente
**Requirement**: ARCH-04, ARCH-05 (estrutura de dados)

**Tools**: MCP: NONE | Skill: NONE

**Done when**:

- [ ] 36 entradas; nenhuma referência a `CaseConverterProvider` (inexistente)
- [ ] Comandos idênticos aos atuais (diff de ids = vazio)
- [ ] Testes: contagem de entradas, unicidade de `command`, agrupamento por categoria
- [ ] Gate quick passa

**Tests**: unit | **Gate**: quick
**Commit**: `feat(registry): registro declarativo único de ferramentas (toolRegistry)`

---

### T4: Teste de consistência registro ↔ manifesto ↔ templates + completar `package.json`

**What**: Criar o teste que valida ARCH-06 (3 regras: comando do registro ausente do manifesto; comando de painel do manifesto ausente do registro, com whitelist p/ comandos de editor; `template` sem arquivo em `src/templates/`). Adicionar ao `package.json` os comandos de conversores hoje ausentes, fazendo o teste passar.
**Where**: `src/test/unit/registryConsistency.test.ts`, `package.json` (contributes.commands)
**Depends on**: T3
**Reuses**: `toolRegistry` (T3); padrão de título/ícone dos comandos existentes
**Requirement**: ARCH-06, ARCH-12 (parcial — comandos adicionados)

**Tools**: MCP: NONE | Skill: NONE

**Done when**:

- [ ] As 3 regras têm teste negativo (fixture com divergência → falha) e o repositório real passa
- [ ] Todos os comandos de conversores declarados no manifesto (AC5 do registro único)
- [ ] Gate quick passa

**Tests**: unit | **Gate**: quick
**Commit**: `feat(registry): teste de consistência com package.json e comandos de conversores no manifesto`

---

### T5: Implementar `BaseWebviewPanel`

**What**: Criar a classe base com: mapa estático `viewType → painel`, `createOrShow` (cria/`reveal`), `dispose` completo, HTML só via `loadTemplate` com erro tratado (`showErrorMessage`, sem exceção), SEM re-render em `onDidChangeViewState` (AD-003), dispatcher de mensagens com whitelist + limites de payload (função de validação pura exportada para teste). Testes unit da validação pura (todos os edge cases da spec).
**Where**: `src/panels/BaseWebviewPanel.ts`, `src/test/unit/messageValidation.test.ts`
**Depends on**: T2, T3
**Reuses**: `loadTemplate` (`templateLoader.ts`), `validateUserInput`/`generateNonce` (`securityUtils.ts`), corpo de `createOrShow`/`dispose` dos providers atuais
**Requirement**: ARCH-01, ARCH-08

**Tools**: MCP: NONE | Skill: NONE

**Done when**:

- [ ] Validação pura testada: comando fora da whitelist → rejeita; sem `command` → rejeita; payload não-string/&gt;100k → rejeita; mensagem válida → passa (1:1 com ACs de ARCH-08 e edge cases da spec)
- [ ] Nenhum uso de `onDidChangeViewState` para re-render
- [ ] Gate quick passa

**Tests**: unit (parte pura) | **Gate**: quick
**Commit**: `feat(panels): BaseWebviewPanel com ciclo de vida unificado e validação de mensagens`

---

### T6: Testes de integração do ciclo de vida de painel

**What**: Testes no extension host cobrindo ACs 1–5 de ARCH-01 com um painel declarativo de teste: criação única, `reveal` sem duplicar, dispose + reabertura, CSP presente no HTML, template ausente → `showErrorMessage` sem crash.
**Where**: `src/test/integration/panelLifecycle.test.ts`
**Depends on**: T5
**Reuses**: `BaseWebviewPanel` (T5), infra de T1
**Requirement**: ARCH-01, ARCH-03 (asserção de CSP)

**Tools**: MCP: NONE | Skill: NONE

**Done when**:

- [ ] 5 ACs de ARCH-01 asseridos com os valores definidos na spec (ex.: HTML contém `Content-Security-Policy` e `nonce-`)
- [ ] Gate full passa

**Tests**: integration | **Gate**: full
**Commit**: `test(panels): integração do ciclo de vida de BaseWebviewPanel`

---

### T7: Migrar conversores e painéis estáticos para entradas declarativas

**What**: Marcar as 17 entradas de conversores (+ painéis sem `onDidReceiveMessage`) como declarativas no registro (sem `factory`), apontando para os templates atuais; **remover** `src/providers/converters/` inteiro (18 arquivos, incl. `baseConverterProvider.ts`).
**Where**: `src/tools/toolRegistry.ts` (modificar), `src/providers/converters/` (deletar)
**Depends on**: T5, T6
**Reuses**: templates HTML inalterados; `BaseWebviewPanel`
**Requirement**: ARCH-02 (parcial), ARCH-03 (parcial)

**Tools**: MCP: NONE | Skill: NONE

**Done when**:

- [ ] `src/providers/converters/` não existe; compile/lint verdes
- [ ] Teste de integração: abrir 2 conversores representativos pelo comando → painel abre com CSP, `reveal` funciona
- [ ] Gate full passa (consistência de T4 continua verde)

**Tests**: integration (representativos) | **Gate**: full
**Commit**: `refactor(converters): 17 conversores viram entradas declarativas; -18 arquivos`

---

### T8: Refazer `extension.ts` sobre o registro + extrair comandos de editor

**What**: `activate` passa a: registrar tree provider + loop único `registerCommand` sobre `getTools()` + registrar comandos de editor a partir de novo `src/commands/editorCommands.ts` (mover handlers de `insert*`, `formatText*`, `ansiFormatterProcessSelection` sem alterá-los). Remover `helloWorld` (comando, handler e entrada do manifesto) e o objeto `lazyProviders` (incl. referência quebrada a `CaseConverterProvider`).
**Where**: `src/extension.ts` (reescrever), `src/commands/editorCommands.ts` (novo), `package.json` (remover helloWorld)
**Depends on**: T7
**Reuses**: `insertUtils.ts` inalterado; `toolRegistry`
**Requirement**: ARCH-04, ARCH-11 (parcial)

**Tools**: MCP: NONE | Skill: NONE

**Done when**:

- [ ] Nenhum `registerCommand` por ferramenta de painel fora do loop; `extension.ts` ≤ ~80 linhas
- [ ] Teste de integração: ativação expõe todos os comandos do registro (`vscode.commands.getCommands`)
- [ ] `helloWorld` e `CaseConverterProvider` inexistentes no repositório
- [ ] Gate full passa

**Tests**: integration | **Gate**: full
**Commit**: `refactor(extension): ativação derivada do registro; comandos de editor extraídos`

---

### T9: Migrar painéis de utilitário simples (lote 1)

**What**: Migrar base64, url-encoder, json-formatter, hash-generator e password-generator para subclasses finas em `src/panels/tools/` (só `messageWhitelist` + `onMessage`; algoritmos copiados verbatim). Whitelist derivada lendo o protocolo real de cada template. Apagar os providers antigos correspondentes.
**Where**: `src/panels/tools/{base64,urlEncoder,jsonFormatter,hashGenerator,passwordGenerator}Panel.ts`; deletar 5 arquivos em `src/providers/`
**Depends on**: T8
**Reuses**: lógica de domínio dos providers atuais; `BaseWebviewPanel`
**Requirement**: ARCH-02 (parcial), ARCH-08 (aplicada)

**Tools**: MCP: NONE | Skill: NONE

**Done when**:

- [ ] 5 painéis funcionam via registro; providers antigos deletados
- [ ] Teste de integração: base64 encode/decode round-trip pelo protocolo de mensagens com valores esperados definidos (ex.: `"dev"` → `"ZGV2"`)
- [ ] Gate full passa

**Tests**: integration | **Gate**: full
**Commit**: `refactor(panels): migra base64/url/json/hash/password para BaseWebviewPanel`

---

### T10: Migrar painéis de utilitário com lógica maior (lote 2)

**What**: Migrar color-converter, date-calculator, email-validator, regex-tester, text-formatter e ansi-formatter para subclasses finas; apagar providers antigos.
**Where**: `src/panels/tools/{colorConverter,dateCalculator,emailValidator,regexTester,textFormatter,ansiFormatter}Panel.ts`; deletar 6 arquivos em `src/providers/`
**Depends on**: T9
**Reuses**: algoritmos existentes (ex.: matemática de cores de `colorConverterProvider.ts` verbatim)
**Requirement**: ARCH-02 (parcial)

**Tools**: MCP: NONE | Skill: NONE

**Done when**:

- [ ] 6 painéis funcionam via registro; providers antigos deletados
- [ ] Teste de integração de 1 representativo (color-converter: HEX→RGB com valor esperado `#ff0000` → `rgb(255, 0, 0)`)
- [ ] Gate full passa

**Tests**: integration (representativo) | **Gate**: full
**Commit**: `refactor(panels): migra color/date/email/regex/text/ansi para BaseWebviewPanel`

---

### T11: Migrar geradores e ferramentas PIX/QR (lote 3 — ganham CSP)

**What**: Migrar cpf, cnpj, uuid, pix-generator, pix-decoder e qr-reader: trocar `fs.readFileSync` por `loadTemplate` (CSP passa a existir — ARCH-03), remover `getNonce` duplicado e placeholders `#{...}` mortos, corrigir `localResourceRoots` (de `resources/` inexistente para `src/templates`), e sanitizar o fallback de erro do PIX com `sanitizeHTML` (ARCH-10). Apagar providers antigos.
**Where**: `src/panels/tools/{cpf,cnpj,uuid,pixGenerator,pixDecoder,qrReader}Panel.ts`; deletar 6 arquivos em `src/providers/`
**Depends on**: T10
**Reuses**: `utils/{cpf,cnpj,uuid,pix}Generator.ts` inalterados; `sanitizeHTML`
**Requirement**: ARCH-03, ARCH-10, ARCH-02 (completa)

**Tools**: MCP: NONE | Skill: NONE

**Done when**:

- [ ] HTML dos 6 painéis contém CSP (teste de integração assere no gerador de CPF)
- [ ] Fallback de erro do PIX passa por `sanitizeHTML` (teste unit da função de fallback com payload `<script>` → escapado)
- [ ] Busca por `fs.readFileSync` em `src/panels/` retorna vazio; `src/providers/` contém apenas `devJuiceProvider.ts`
- [ ] Gate full passa

**Tests**: unit (fallback) + integration (CSP) | **Gate**: full
**Commit**: `refactor(panels): migra geradores e PIX/QR; CSP universal e fallback sanitizado`

---

### T12: Tree view derivada do registro

**What**: Reescrever `DevJuiceProvider.getChildren` para derivar categorias e itens de `getToolsByCategory()` (sem listas hardcoded), preservando ícones/tooltips via campos do registro. Teste de integração: tree renderiza as 4 categorias e o total de itens = total do registro; registro vazio (mock) não lança.
**Where**: `src/providers/devJuiceProvider.ts` (modificar), `src/test/integration/treeView.test.ts`
**Depends on**: T11
**Reuses**: `DevToolItem` atual; `toolRegistry`
**Requirement**: ARCH-05

**Tools**: MCP: NONE | Skill: NONE

**Done when**:

- [ ] Nenhuma lista de ferramentas hardcoded no arquivo (~302 → ~80 linhas)
- [ ] Testes de tree passam com os valores esperados (4 categorias; contagem = registro)
- [ ] Gate full passa

**Tests**: integration | **Gate**: full
**Commit**: `refactor(tree): tree view derivada do toolRegistry`

---

### T13: Remover código morto remanescente

**What**: Deletar `base64EncoderProviderOptimized.ts` e `webviewManager.ts`; remover exports sem uso de `templateLoader.ts` (`loadAndProcessTemplate`, `processTemplate` se sem uso) — `baseConverterProvider.ts` já saiu na T7 e `helloWorld` na T8. Verificação final por busca de símbolos.
**Where**: deletar 2 arquivos; `src/utils/templateLoader.ts` (podar)
**Depends on**: T12
**Reuses**: —
**Requirement**: ARCH-11

**Tools**: MCP: NONE | Skill: NONE

**Done when**:

- [ ] Busca por `WebviewManager|Base64EncoderProviderOptimized|loadAndProcessTemplate|createOrShowSecurePanel|helloWorld|CaseConverterProvider` em `src/` retorna vazio
- [ ] Gate build passa (suíte completa verde)

**Tests**: none (camada sem exigência — gate de build) | **Gate**: build
**Commit**: `chore: remove infraestrutura morta (webviewManager, base64Optimized, exports sem uso)`

---

### T14: Higiene final do manifesto

**What**: Revisar `contributes.commands`: títulos no padrão (`"Conversor de X"` etc.), ícones codicon coerentes com o registro, categoria; confirmar ativação por comando (engine ≥1.74 ativa por `contributes.commands`; `activationEvents` mantém só `onView`). Atualizar `README.md` se a lista de comandos divergir.
**Where**: `package.json`, `README.md` (se necessário)
**Depends on**: T13
**Reuses**: teste de consistência (T4) como verificação automática
**Requirement**: ARCH-12

**Tools**: MCP: NONE | Skill: NONE

**Done when**:

- [ ] Teste de consistência verde; nenhum comando de painel sem título/ícone padronizado
- [ ] Gate build passa
- [ ] Extensão empacotável: `npm run compile` + estrutura íntegra

**Tests**: none (manifesto — coberto pelo teste de consistência existente) | **Gate**: build
**Commit**: `chore(manifest): títulos, ícones e ativação consistentes com o registro`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

Phase 1:  T1 ──→ T2 ──→ T3 ──→ T4
Phase 2:  T5 ──→ T6
Phase 3:  T7 ──→ T8
Phase 4:  T9 ──→ T10 ──→ T11
Phase 5:  T12 ──→ T13 ──→ T14
```

Execução estritamente sequencial. Com 14 tarefas (> ~8), o Execute deve **oferecer sub-agentes**
antes de iniciar: Batch 1 = Fases 1–2 (6 tarefas), Batch 2 = Fases 3–5 (8 tarefas). Após a T14, o
**Verifier roda automaticamente** (autor ≠ verificador) e grava `validation.md`.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Infra de testes | 1 config + 2 smokes | ✅ Granular |
| T2: Nonce + testes securityUtils | 1 arquivo + seus testes | ✅ Granular |
| T3: toolRegistry | 1 arquivo novo + testes | ✅ Granular |
| T4: Teste de consistência + manifesto | 1 teste + 1 edição de manifesto (coesos: o teste força a edição) | ✅ OK (coeso) |
| T5: BaseWebviewPanel | 1 classe + testes da parte pura | ✅ Granular |
| T6: Integração do ciclo de vida | 1 arquivo de teste | ✅ Granular |
| T7: Conversores declarativos | 1 edição de registro + deleção em bloco de arquivos 97% idênticos | ✅ OK (uma operação coesa) |
| T8: extension.ts + editorCommands | 2 arquivos, mesma costura (mover handlers) | ✅ OK (coeso) |
| T9: Migração lote 1 (5 painéis) | 5 subclasses do mesmo padrão | ⚠️ OK — mesmo padrão mecânico repetido; split não reduziria risco |
| T10: Migração lote 2 (6 painéis) | 6 subclasses do mesmo padrão | ⚠️ OK — idem |
| T11: Migração lote 3 (6 painéis + CSP/sanitização) | 6 subclasses + 2 correções de segurança localizadas | ⚠️ OK — correções fazem parte da própria migração desses arquivos |
| T12: Tree view | 1 arquivo + teste | ✅ Granular |
| T13: Código morto | Deleções verificáveis | ✅ Granular |
| T14: Manifesto | 1 arquivo | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | início da Fase 1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T1 | T2 → T3 (sequencial na fase; T2 precede por ordem, dependência real é T1) | ✅ Match — ordem da fase respeita a dependência |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T2, T3 | Fase 1 → Fase 2 (T5 abre a fase) | ✅ Match — dependências em fase anterior |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T5, T6 | Fase 2 → Fase 3 (T7 abre a fase) | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | Fase 3 → Fase 4 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | T11 | Fase 4 → Fase 5 | ✅ Match |
| T13 | T12 | T12 → T13 | ✅ Match |
| T14 | T13 | T13 → T14 | ✅ Match |

Nenhuma dependência aponta para fase posterior. ✅

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: Infra de testes | infra de teste (meta) | — (é a própria infra) | unit + integration smokes | ✅ OK |
| T2: securityUtils | Utilitários puros | unit | unit | ✅ OK |
| T3: toolRegistry | Registro | unit | unit | ✅ OK |
| T4: Consistência + manifesto | Registro/consistência | unit | unit | ✅ OK |
| T5: BaseWebviewPanel | Validação de msg (pura) | unit | unit | ✅ OK — parte host coberta na T6 (merge forward: testes de host só rodam com painel de teste fiado, criado na T6) |
| T6: Ciclo de vida | Painel (host) | integration | integration | ✅ OK |
| T7: Conversores | Painéis migrados | integration (representativos) | integration | ✅ OK |
| T8: extension.ts | Fiação | integration | integration | ✅ OK |
| T9: Lote 1 | Painéis migrados | integration (representativos) | integration | ✅ OK |
| T10: Lote 2 | Painéis migrados | integration (representativos) | integration | ✅ OK |
| T11: Lote 3 | Painéis + segurança | unit (fallback) + integration (CSP) | unit + integration | ✅ OK |
| T12: Tree view | Fiação | integration | integration | ✅ OK |
| T13: Código morto | deleções | none (build gate) | none | ✅ OK — matriz não exige teste para deleção; suíte completa roda no gate |
| T14: Manifesto | config/manifesto | none (coberto por teste de consistência já existente) | none | ✅ OK |

Nenhuma violação. ✅

---

## Rastreabilidade requisito → tarefa

| Requirement | Tarefas |
| ----------- | ------- |
| ARCH-01 | T5, T6 |
| ARCH-02 | T7, T9, T10, T11 |
| ARCH-03 | T6 (asserção), T7, T11 |
| ARCH-04 | T3, T8 |
| ARCH-05 | T3, T12 |
| ARCH-06 | T4 |
| ARCH-07 | T1 |
| ARCH-08 | T5, T9 |
| ARCH-09 | T2 |
| ARCH-10 | T11 |
| ARCH-11 | T8, T13 |
| ARCH-12 | T4, T14 |

**Coverage:** 12 requisitos, 12 mapeados, 0 sem mapeamento. ✅
