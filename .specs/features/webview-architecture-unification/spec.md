# Unificação da Arquitetura de Webviews — Especificação

**Feature**: `webview-architecture-unification`
**Escopo (auto-sizing)**: Large — multi-componente, ~40 arquivos TS afetados, decisões arquiteturais
**Status**: Draft (aguardando aprovação do usuário)

---

## Problem Statement

A extensão Dev Juice tem ~36 providers de webview que repetem o mesmo boilerplate de ciclo de vida
(`createOrShow`, singleton, `dispose`, carregamento de template): **~50–55% das ~5.000 linhas de
providers é código duplicado**, e os 17 conversores de unidade são 97% idênticos entre si (diferem em
3 strings). O registro de ferramentas é mantido **em triplicata** (`extension.ts`,
`devJuiceProvider.ts`, `package.json`) e já divergiu: comandos de conversores não estão declarados no
manifesto e `extension.ts:13` referencia um `CaseConverterProvider` que **não existe no repositório**.
Há infraestrutura morta (`webviewManager.ts`, `base64EncoderProviderOptimized.ts`,
`baseConverterProvider.ts` sem subclasses), postura de segurança inconsistente (4 painéis geradores
carregam HTML sem CSP, nonce via `Math.random()`, mensagens de webview sem validação, interpolação de
erro em HTML) e **zero testes**. Cada nova ferramenta exige copiar ~93 linhas e editar 3 lugares.

## Goals

- [ ] Eliminar o boilerplate duplicado de providers: classe base única + registro declarativo (alvo: ~2.500 linhas removidas; conversores viram entradas de dados, sem classe própria)
- [ ] Registro único de ferramentas alimentando comandos, tree view e consistência com `package.json` (zero divergência verificada por teste)
- [ ] 100% dos painéis carregando HTML via `loadTemplate` com CSP e nonce criptográfico
- [ ] Validação de mensagens de webview centralizada na classe base
- [ ] Código morto removido (5 itens identificados)
- [ ] Infraestrutura de testes operacional (`npm test` roda e passa), com testes unitários do novo núcleo

## Out of Scope

Explicitamente excluído para prevenir scope creep.

| Feature | Motivo |
| ------- | ------ |
| Redesign visual dos templates HTML (nova UI/UX) | Melhora separada; esta feature unifica arquitetura sem alterar comportamento visível. Candidata a próxima feature (`ui-refresh`), que ficará muito mais barata após o registro único e CSS compartilhado |
| Deduplicação completa do CSS/JS dos 34 templates (~3.000 linhas) | Alto volume, risco de regressão visual sem testes de UI; registrada como follow-up. A base criada aqui (CSP uniforme, `loadTemplate` universal) é pré-requisito |
| Novas ferramentas ou mudança de funcionalidade das existentes | Refatoração deve preservar comportamento (exceto correções de segurança) |
| Bundling (esbuild/webpack) e otimização de empacotamento | Ortogonal; não bloqueia nem é bloqueado por esta feature |
| Migração das conversões que rodam dentro do HTML para TypeScript | Os 17 conversores calculam no próprio template; mover a lógica é mudança de comportamento/arquitetura de outra ordem |

---

## Assumptions & Open Questions

Toda ambiguidade foi resolvida ou registrada aqui — nada fica silenciosamente indefinido.
(Agente executando de forma autônoma: gray areas viram assunções com default + justificativa.)

| Assunção / decisão | Default escolhido | Justificativa | Confirmado? |
| ------------------ | ----------------- | ------------- | ----------- |
| Qual melhora priorizar ("código horrível" vs "interface simples") | Unificação da arquitetura (código) | O usuário enfatizou o código primeiro; a interface depende de templates duplicados — refatorar antes torna qualquer melhoria de UI 34× mais barata (1 lugar em vez de 34) | n |
| Tipos de teste do projeto (não existem testes; skill manda perguntar) | Unit (Mocha via `@vscode/test-cli`, já em devDependencies) para lógica pura; integration (extension host) para ciclo de vida de painel; `npm test` como comando | Reusa a infra já declarada em `package.json` (`"test": "vscode-test"`); nenhuma dependência nova | n |
| Conversores viram entradas de registro sem classe própria | Sim — um `GenericToolPanel` + entrada declarativa `{ id, título, template }` | Os 17 arquivos diferem em 3 strings; manter 17 classes contradiz o objetivo | n |
| `package.json` sincronizado manualmente ou gerado | Verificado por teste de consistência (falha se divergir), não gerado em build | Geração de manifesto adiciona passo de build frágil; teste dá a mesma garantia com menos maquinário | n |
| Comportamento do comando `helloWorld` e providers mortos | Remover | Sobra de template do VS Code; `Base64EncoderProviderOptimized` nunca é importado e tem protocolo incompatível com o template | n |
| Correções de segurança podem alterar comportamento observável? | Sim, apenas onde o comportamento atual é falha (painéis sem CSP passam a ter CSP; mensagens inválidas passam a ser ignoradas com log) | São correções, não features; preservar a falha não é requisito | n |
| `onDidChangeViewState` → `_update()` (recarrega HTML estático ao trocar de aba) | Remover na classe base | Recarga é inútil para HTML estático e destrói estado digitado pelo usuário; corrigir na unificação evita re-migração | n |

**Open questions:** nenhuma — todas resolvidas ou registradas acima.

---

## Sweep de dimensões implícitas (obrigatório para Large)

| Dimensão | Resolução |
| -------- | --------- |
| Validação de entrada & limites | Requisito ARCH-08 (validação de mensagens: whitelist de comandos, tipo e tamanho de payload) |
| Estados de falha / falha parcial | Requisito ARCH-01 (template ausente → mensagem de erro, host não quebra); edge cases abaixo |
| Idempotência / retry / duplicatas | Requisito ARCH-01 (reinvocar comando com painel aberto → `reveal`, nunca duplica painel) |
| Fronteiras de auth & rate limit | N/A — extensão local, sem chamadas autenticadas nem endpoints |
| Concorrência / ordenação | N/A — VS Code entrega mensagens de webview serialmente no extension host; singleton por painel já elimina corrida de criação |
| Ciclo de vida / expiração de dados | Cache de templates já existe em `templateLoader`; comportamento mantido. Sem outra persistência — N/A além disso |
| Observabilidade | Mensagens rejeitadas são logadas via `console.warn` (suficiente para extensão; sem infra de métricas) |
| Falha de dependência externa | N/A — nenhuma chamada de rede nesta feature (conversor de moeda usa taxas fixas no template; fora de escopo alterá-lo) |
| Integridade de transição de estado | Ciclo de vida do painel: `criado → visível → descartado`; `dispose` limpa singleton e disposables (ARCH-01) |

---

## User Stories

### P1: Núcleo de webview unificado ⭐ MVP

**User Story**: Como mantenedora da extensão, quero um único ponto de implementação do ciclo de vida
de webviews para que criar/corrigir ferramentas exija tocar um só lugar.

**Why P1**: É a raiz de ~2.500 linhas duplicadas; todas as demais stories dependem dele.

**Acceptance Criteria**:

1. WHEN um comando de ferramenta é executado sem painel aberto THEN o sistema SHALL criar exatamente um `WebviewPanel` com `enableScripts: true` e `localResourceRoots` restrito a `src/templates`
2. WHEN um comando de ferramenta é executado com o painel daquela ferramenta já aberto THEN o sistema SHALL revelar (`reveal`) o painel existente e SHALL NOT criar um segundo painel
3. WHEN o painel é fechado pelo usuário THEN o sistema SHALL limpar o singleton e descartar todos os disposables, e uma nova invocação do comando SHALL criar um painel novo
4. WHEN o HTML de qualquer painel é gerado THEN o sistema SHALL obtê-lo via `loadTemplate` com meta tag CSP e nonce aplicados (inclusive CPF, CNPJ, UUID e PIX, que hoje fazem `fs.readFileSync` direto)
5. WHEN o template referenciado não existe ou falha ao carregar THEN o sistema SHALL exibir `vscode.window.showErrorMessage` e SHALL NOT lançar exceção não tratada no extension host
6. WHEN a migração terminar THEN nenhum provider SHALL conter implementação própria de `createOrShow`/`dispose`/`_update` (verificável por busca no código)

**Independent Test**: Abrir 3 ferramentas de famílias diferentes (um conversor, o Base64, o gerador de CPF), reinvocar cada comando com o painel aberto, fechar e reabrir — comportamento idêntico ao atual, HTML com CSP presente nos 3.

---

### P1: Registro único de ferramentas ⭐ MVP

**User Story**: Como mantenedora, quero declarar cada ferramenta uma única vez (id, título, categoria, ícone, template/fábrica) para que comandos, tree view e manifesto nunca divirjam.

**Why P1**: A triplicação já causou bugs reais (conversores fora do command palette; referência a arquivo inexistente).

**Acceptance Criteria**:

1. WHEN a extensão ativa THEN o sistema SHALL registrar um comando para cada entrada do registro (nenhum `registerCommand` manual por ferramenta em `extension.ts`)
2. WHEN a tree view é renderizada THEN o sistema SHALL derivar categorias e itens do registro (nenhuma lista hardcoded em `devJuiceProvider.ts`)
3. WHEN o teste de consistência roda THEN ele SHALL falhar se existir comando de ferramenta no registro ausente de `contributes.commands` do `package.json`, ou vice-versa (exceções documentadas: comandos de editor como `insert*`/`formatText*` continuam declarados diretamente)
4. WHEN uma entrada do registro referencia um template THEN o teste de consistência SHALL falhar se `src/templates/{nome}.html` não existir
5. WHEN a migração terminar THEN todos os comandos de conversores (ex.: `dev-juice.lengthConverter`) SHALL estar declarados em `package.json` e acessíveis pelo command palette

**Independent Test**: Adicionar uma ferramenta fake ao registro em uma branch de teste → ela aparece na tree e no palette sem tocar `extension.ts`/`devJuiceProvider.ts`; remover o comando do `package.json` → teste de consistência falha.

---

### P1: Infraestrutura de testes operacional ⭐ MVP

**User Story**: Como mantenedora, quero `npm test` executável com testes reais para que refatorações (esta e futuras) tenham rede de proteção.

**Why P1**: Os gates de todas as demais tarefas dependem dela; hoje `npm test` não tem nenhum arquivo de teste.

**Acceptance Criteria**:

1. WHEN `npm test` é executado THEN o runner SHALL descobrir e executar os testes de `src/test/**` e retornar exit code 0 com todos passando
2. WHEN um teste falha THEN `npm test` SHALL retornar exit code diferente de 0
3. WHEN a feature terminar THEN utilitários puros do novo núcleo (registro, validação de mensagem, `securityUtils`) SHALL ter testes unitários cobrindo os ACs desta spec que os referenciam

**Independent Test**: `npm test` no CI/local passa; quebrar propositalmente uma asserção → comando falha.

---

### P2: Endurecimento de segurança

**User Story**: Como usuária da extensão, quero que todos os webviews tenham CSP, nonces criptográficos e validação de mensagens para reduzir superfície de XSS.

**Why P2**: Risco real, mas depende do núcleo unificado (P1) para ser aplicado em um único lugar.

**Acceptance Criteria**:

1. WHEN um nonce é gerado THEN `generateNonce` SHALL usar `crypto.randomBytes` (não `Math.random`) e retornar ≥ 32 caracteres alfanuméricos
2. WHEN um webview envia mensagem com `command` fora da whitelist do painel THEN o sistema SHALL ignorar a mensagem e logar `console.warn` (sem lançar exceção)
3. WHEN um webview envia payload que não é string ou excede 100.000 caracteres THEN o sistema SHALL rejeitar a mensagem e responder com erro amigável ao webview quando o protocolo do painel previr resposta
4. WHEN o painel PIX gera HTML de fallback de erro THEN o conteúdo do erro SHALL passar por `sanitizeHTML` antes de interpolação (corrige `pixPanelProvider.ts:209`)
5. WHEN qualquer painel é aberto THEN o HTML servido SHALL conter meta tag CSP com `default-src 'none'` e `script-src 'nonce-...'`

**Independent Test**: Inspecionar HTML dos painéis geradores (hoje sem CSP) → CSP presente; enviar mensagem forjada com comando inválido via devtools do webview → ignorada com warn, extensão segue funcional.

---

### P2: Remoção de código morto

**User Story**: Como mantenedora, quero remover infraestrutura abandonada para que o código restante reflita a arquitetura real.

**Why P2**: Baixo custo, alto ganho de clareza; feito após a migração para não remover algo ainda referenciado.

**Acceptance Criteria**:

1. WHEN a limpeza terminar THEN os seguintes SHALL NOT existir no repositório: `base64EncoderProviderOptimized.ts`, `webviewManager.ts`, `baseConverterProvider.ts` (superseded pela nova base), comando/handler `helloWorld`, referência a `CaseConverterProvider` em `extension.ts`, `getNonce` duplicado em `cpfPanelProvider.ts`/`uuidPanelProvider.ts`
2. WHEN `npm run compile && npm run lint` roda após a remoção THEN SHALL passar sem erros
3. WHEN se busca por `loadAndProcessTemplate` e `createOrShowSecurePanel` THEN não SHALL haver exports sem uso (remover ou passar a usar — default: remover)

**Independent Test**: `grep` pelos símbolos removidos retorna vazio; build e lint verdes; todas as ferramentas seguem abrindo.

---

### P3: Higiene de manifesto e ativação

**User Story**: Como usuária, quero encontrar todas as ferramentas no command palette com títulos consistentes.

**Why P3**: Cosmético/completude; o teste de consistência (P1) já impede regressão futura.

**Acceptance Criteria**:

1. WHEN o `package.json` é atualizado THEN todos os comandos de ferramentas SHALL ter título no padrão existente (`"Conversor de X"`, ícone codicon) e categoria coerente
2. WHEN a extensão é empacotada THEN `activationEvents` SHALL cobrir a ativação por qualquer comando declarado (VS Code ≥1.74 gera ativação implícita por `contributes.commands`; garantir que nada dependa só de `onView`)

---

## Edge Cases

- WHEN dois comandos de ferramentas diferentes são executados em sequência THEN cada um SHALL ter seu próprio painel singleton independente (o singleton é por ferramenta, não global)
- WHEN o usuário fecha o painel durante processamento de mensagem THEN o handler SHALL falhar silenciosamente (painel descartado), sem exception não tratada
- WHEN `loadTemplate` recebe nome de template com path traversal (ex.: `../evil`) THEN o carregamento SHALL falhar com erro controlado (nomes vêm do registro, mas o teste cobre o contrato)
- WHEN o webview envia mensagem sem campo `command` THEN o sistema SHALL ignorar com `console.warn`
- WHEN a extensão ativa com o registro vazio (estado teórico) THEN a tree view SHALL renderizar vazia sem lançar exceção

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| ARCH-01 | P1: Núcleo unificado (ciclo de vida singleton/reveal/dispose) | Design | Pending |
| ARCH-02 | P1: Núcleo unificado (36 providers migrados, zero boilerplate próprio) | Design | Pending |
| ARCH-03 | P1: Núcleo unificado (100% via `loadTemplate` + CSP) | Design | Pending |
| ARCH-04 | P1: Registro único (comandos derivados do registro) | Design | Pending |
| ARCH-05 | P1: Registro único (tree view derivada do registro) | Design | Pending |
| ARCH-06 | P1: Registro único (teste de consistência registro ↔ manifesto ↔ templates) | Design | Pending |
| ARCH-07 | P1: Infra de testes (`npm test` operacional com testes reais) | Design | Pending |
| ARCH-08 | P2: Segurança (validação de mensagens na base) | Design | Pending |
| ARCH-09 | P2: Segurança (nonce criptográfico) | Design | Pending |
| ARCH-10 | P2: Segurança (sanitização do fallback de erro PIX) | Design | Pending |
| ARCH-11 | P2: Código morto (5 itens removidos, build verde) | Design | Pending |
| ARCH-12 | P3: Manifesto (comandos completos e consistentes no palette) | Design | Pending |

**ID format:** `ARCH-NN`
**Status values:** Pending → In Design → In Tasks → Implementing → Verified
**Coverage:** 12 no total; mapeamento para tarefas em `tasks.md`.

---

## Success Criteria

Como saberemos que a melhora deu certo:

- [ ] Redução de ≥ 2.000 linhas em `src/providers/**` com todas as 36 ferramentas funcionais (diff mensurável)
- [ ] Adicionar uma ferramenta nova = 1 entrada no registro + 1 template + declaração no manifesto (demo executável)
- [ ] `npm test` verde com testes cobrindo os ACs de P1/P2; teste de consistência impede nova divergência de registro
- [ ] 100% dos painéis com CSP (verificável por teste que inspeciona o HTML gerado)
- [ ] Zero referências a arquivos/símbolos inexistentes (`CaseConverterProvider` etc.)
