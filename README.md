# thesis# THESIS: The Council
Codinome: THESIS

## 1) Norte do projeto
Construir uma plataforma de análise de VC orientada por múltiplos agentes, com debate estruturado, orçamento de interação e veredito final auditável.

Requisitos obrigatórios:
1. Arquitetura modular com API, Gateway, CLI e dashboard.
2. Runtime de agentes com Pi Moro.
3. Prompt Adapter com conceito SOUL.md.
4. Skills carregáveis por perfil/contexto.
5. Memória de longo prazo.
6. Evolução por fases pequenas, sempre com teste de validação por fase.
7. Começar com poucas tools (bash seguro), expandindo só quando houver necessidade real.

## 2) Inspiração direta no OpenClaw (sem copiar complexidade cedo)
Referências para estudar padrão arquitetural:
1. CLI: `/Users/gustavo.barros/IA/openclaw/src/cli`
2. Roteamento e canais: `/Users/gustavo.barros/IA/openclaw/src/routing` e `/Users/gustavo.barros/IA/openclaw/src/channels`
3. Extensões/plugins: `/Users/gustavo.barros/IA/openclaw/extensions`

Princípio: copiar padrões de separação de responsabilidades, não volume de features.

## 3) Arquitetura alvo (The Triad + Core packages)
Estrutura sugerida:
1. `apps/thesis-api`: Ledger API (Fastify), autenticação, estado de sessão, histórico, WebSocket.
2. `apps/thesis-gateway`: worker que orquestra agent loop e entrega eventos.
3. `apps/thesis-cli`: interface operacional (humanos e agentes externos).
4. `apps/thesis-war-room`: dashboard read-only (Next.js).
5. `packages/agent-core`: loop do Pi Moro, políticas e execução.
6. `packages/prompt-adapter`: composição de prompt (base + SOUL + perfil + skills + restrições).
7. `packages/skills`: parser/loader/registry de skills.
8. `packages/tools`: tool registry (início: bash seguro).
9. `packages/memory`: memória curta e longa.
10. `packages/protocol`: contratos de evento/comando.
11. `packages/testing`: fixtures e testes e2e.

## 4) Conceitos de domínio (THESIS)
1. Session: análise de uma startup com ID, rodada e documentos.
2. Hypothesis: tese principal a validar/refutar.
3. Agent Profile: especialidade com prompt e peso.
4. Interaction Budget: créditos por ação do agente.
5. Ledger: trilha de auditoria completa de opiniões, ações e votos.

## 5) Prompt Adapter (SOUL.md)
Ordem de composição obrigatória:
1. `base_system`
2. `SOUL.md` global
3. `profile soul` (Debt/Tech/Market/Branding)
4. skills ativas
5. runtime constraints (budget, tool policy, session rules)

Requisito:
1. Salvar snapshot do prompt final por interação para auditoria.

## 6) Skills
Formato inicial:
1. Markdown com metadados mínimos (`id`, `role`, `when_to_use`, `constraints`).
2. Carregamento por perfil e contexto da sessão.
3. Allowlist por sessão/agente.
4. Versionamento da skill no Ledger.

## 7) Tools (estratégia minimalista)
Fase inicial:
1. `bash.exec` com allowlist fixa (`ls`, `cat`, `rg`, `wc`, `head`, `tail`, `jq`).
2. timeout por execução.
3. limite de output.
4. execução em diretório controlado.
5. log completo no Ledger (comando, duração, status, custo).

Expansão:
1. Só adicionar tools quando um caso concreto bloquear evolução do produto.

## 8) Memória de longo prazo
Versão inicial:
1. Persistir fatos e sumários no banco principal.
2. Recuperação por heurística textual simples.
3. Injetar contexto recuperado no Prompt Adapter.

Versão futura:
1. ranking de memória útil por impacto no veredito.
2. embeddings só quando necessário.

## 9) Roadmap incremental (com validação)
### Fase 0: Foundation
Objetivo: monorepo, contratos e ambiente docker.
Entrega: API + Postgres sobem com comando único em docker; CLI e Gateway rodam localmente.
Teste: build + lint + testes base verdes.

### Fase 1: Ledger + Sessão (MVP 1)
Objetivo: criar sessão, anexar docs, consultar status.
CLI: `init-session`, `upload-doc`, `status`.
Teste:
1. abrir sessão
2. subir documento
3. consultar status
4. validar persistência no banco

### Fase 2: Join + Opinion + MCP básico (MVP 2)
Objetivo: agente externo entra com perfil e publica opinião.
CLI: `join-session --role`, `post-opinion`.
Teste:
1. agente conecta
2. lê doc da sessão
3. publica opinião
4. evento aparece no Ledger/API

### Fase 3: Budget + Diálogo (MVP 3)
Objetivo: economia de créditos e diálogo entre agentes.
CLI: `listen --continuous`, `ask @agent`.
Teste:
1. dois agentes em containers separados
2. A pergunta para B
3. débito de créditos no A
4. entrega de notificação para B

### Fase 4: Veredito + Relatório + Ranking (MVP 4)
Objetivo: fechar ciclo de análise.
CLI: `cast-vote`, `generate-report`, `close-session`.
Teste:
1. encerrar sessão
2. relatório consolidado com opiniões
3. veredito humano simulado
4. ranking de autoridade atualizado

### Fase 5: War Room (Final MVP)
Objetivo: dashboard read-only em tempo real.
Entrega: timeline da sessão, agentes, créditos, votos e relatório.
Teste: sessão ao vivo refletida via websocket sem inconsistência.

### Fase 6: Hardening
Objetivo: confiabilidade e segurança operacional.
Entrega: retries, observabilidade, limites de execução, auditoria.
Teste: cenários de falha (timeout, restart, desconexão).

### Fase 7: Integrações externas
Objetivo: adicionar canais externos sem mexer no core.
Entrega: SDK de adapter + 1 integração (Slack ou WhatsApp).
Teste: fluxo e2e completo por canal externo.

## 10) Protocolo de desenvolvimento (obrigatório em toda fase)
1. Drafting: schema + interfaces + contratos.
2. Implementation: TypeScript estrito.
3. Dockerization: ambiente reproduzível.
4. Verification: executar comandos reais da fase antes de entregar.
5. Evidence: anexar checklist de teste com resultado.

Guia de execução de testes: `TESTING.md`.

## 12) Modo operacional atual
1. Docker Compose sobe apenas serviços de infraestrutura e API (`postgres` e `api`).
2. `thesis-gateway` roda local, iniciado via `thesis analyze` (spawn local).
3. `thesis-cli` e `thesis-war-room` rodam local fora do docker-compose.

## 13) Manutenção do Gateway
Para facilitar evolução incremental:
1. `index.ts` deve ficar enxuto (bootstrap).
2. `session-runner.ts` concentra o loop por sessão.
3. `command-dispatcher.ts` aplica comandos humanos sem acoplar ao loop.
4. `websocket-event-parser.ts` valida eventos WS antes de processar comandos.
5. `runner-state.ts` contém transições puras para testes de fluxo (`idle/resume/vote`).
6. `api-gateway-client.ts` centraliza chamadas HTTP para a API.

## 11) Critério de avanço entre fases
1. testes da fase atual verdes
2. demo curta reproduzível
3. nenhum blocker crítico aberto
4. dívida técnica registrada com prazo
