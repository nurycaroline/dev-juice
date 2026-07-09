# STATE

## Decisions

### AD-001
- **Decision**: Toda ferramenta de painel é declarada exclusivamente em `src/tools/toolRegistry.ts`; comandos e tree view derivam do registro, e a consistência com `package.json` é garantida por teste (não por geração em build).
- **Reason**: A triplicação de registro (extension.ts, devJuiceProvider.ts, package.json) já causou divergências reais; um teste dá a mesma garantia que geração de manifesto com muito menos maquinário.
- **Trade-off**: O manifesto ainda é editado manualmente ao adicionar ferramenta (o teste avisa, não corrige).
- **Scope**: Todas as features que adicionem/alterem ferramentas ou comandos.
- **Date**: 2026-07-08
- **Status**: active

### AD-002
- **Decision**: Todo HTML de webview passa por `templateLoader.loadTemplate` (CSP + nonce criptográfico); nenhum painel lê template com `fs.readFileSync` direto, e mensagens de webview são validadas na `BaseWebviewPanel` (whitelist de comandos + limites de payload) antes de chegar à lógica de domínio.
- **Reason**: Postura de segurança era inconsistente (4 painéis sem CSP, nonce via Math.random, mensagens sem validação); centralizar na base elimina a classe de erro.
- **Trade-off**: Painéis que precisem de CSP mais permissivo terão que estender a base explicitamente.
- **Scope**: Qualquer painel/webview atual ou futuro.
- **Date**: 2026-07-08
- **Status**: active

### AD-003
- **Decision**: Painéis de webview não re-renderizam HTML em `onDidChangeViewState`; o HTML é definido uma vez na criação.
- **Reason**: O padrão copiado re-renderizava HTML estático ao trocar de aba, destruindo o estado digitado pelo usuário sem nenhum benefício.
- **Trade-off**: Painéis que futuramente precisem de conteúdo dependente de visibilidade deverão implementar isso deliberadamente.
- **Scope**: `BaseWebviewPanel` e todas as subclasses/painéis declarativos.
- **Date**: 2026-07-08
- **Status**: active

## Handoff

- **Feature**: webview-architecture-unification (`.specs/features/webview-architecture-unification/`)
- **Phase / Task**: Planejamento concluído — spec.md, design.md e tasks.md escritos; Execute NÃO iniciado
- **Completed**: none (nenhuma tarefa de implementação executada)
- **In-progress** (file:line): none
- **Next step**: Usuário revisa/aprova spec + design + tasks; em seguida ativar a skill `tlc-spec-driven` e iniciar Execute pela Fase 1 (T1)
- **Blockers**: Aprovação do usuário; assunções da spec marcadas "Confirmado? n" aguardam confirmação
- **Uncommitted files**: none (planejamento commitado na branch)
- **Branch**: cursor/spec-webview-architecture-unification-91e3
