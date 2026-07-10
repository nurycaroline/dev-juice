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

### AD-004
- **Decision**: Publicação no Marketplace é automatizada via GitHub Action que dispara a todo push em `main`, executa lint + compile + testes (xvfb) + `vsce package`, e publica com `@vscode/vsce` usando o secret `VSCE_PAT`. A publicação é idempotente: um gate (`should-publish.mjs`) consulta `vsce show --json` e pula o `vsce publish` quando a versão do `package.json` já está publicada.
- **Reason**: O fluxo manual atual (bump de versão + `vsce publish` local) é propenso a esquecimento; automatizar no push de `main` alinha com o fluxo do mantenedor. A idempotência evita falhas em pushes que não bumpam versão (ex.: só docs) — o Marketplace rejeita re-publicar a mesma versão, então o gate converte esse erro em skip silencioso.
- **Trade-off**: O mantenedor ainda precisa bumpar `version` no `package.json` manualmente antes de fundir releases (a action não auto-bumpa nem cria git tag, evitando loops). Requer configurar o secret `VSCE_PAT` uma única vez. Testes baixam VS Code (~287 MB) a cada run, adicionando ~1-2 min ao pipeline.
- **Scope**: Pipeline de release/publicação; `.github/workflows/publish.yml`, `.github/scripts/should-publish.mjs`, scripts `package`/`deploy` em `package.json`.
- **Date**: 2026-07-10
- **Status**: active

## Handoff

- **Feature**: publish-extension-action (inline spec — escopo Small)
- **Phase / Task**: Execute CONCLUÍDO — workflow + helper + scripts package.json implementados e verificados localmente (lint ✓, 72 testes ✓ via `xvfb-run`, `vsce package` ✓, `should-publish.mjs` ✓ emite `should-publish=false` para 0.0.6 já publicada)
- **Completed**: `.github/workflows/publish.yml`, `.github/scripts/should-publish.mjs`, scripts `package`/`deploy`, `@vscode/vsce@^3.9.2` em devDependencies, AD-004 gravado
- **In-progress** (file:line): none
- **Next step**: Revisão/merge do PR. Pós-merge, o mantenedor precisa (uma única vez) adicionar o secret `VSCE_PAT` em Settings → Secrets → Actions; daí em diante todo push em `main` publica automaticamente (idempotente).
- **Blockers**: none — a action roda mesmo sem o secret (emite `::warning::` e pula publish); publish real só ocorre após configurar `VSCE_PAT` e bumpar `version`.
- **Uncommitted files**: none (tudo commitado nesta branch)
- **Verifier**: standalone fresh-eyes pass — spec-anchored outcome check (trigger=push main ✓, gate lint+test+package ✓, publish idempotente ✓, auth via VSCE_PAT ✓); discrimination: doc-only push sem bump → skip ✓, secret ausente → warning+skip ✓, teste falha → publish não roda ✓
- **Branch**: cursor/publish-extension-action-c163
