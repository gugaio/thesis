# THESIS: The Council
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
5. `apps/thesis-agent-runtime`: loop do Pi Moro, políticas e execução (worker threads).
6. `packages/prompt-adapter`: composição de prompt (base + SOUL + perfil + skills + restrições).
7. `packages/tools`: tool registry (início: bash seguro).
8. `packages/memory`: memória curta e longa.
9. `packages/protocol`: contratos de evento/comando.
10. `packages/skills`: parser/loader/registry de skills.
11. `packages/testing`: fixtures e testes e2e.

## 4) Conceitos de domínio (THESIS)
1. Session: análise de uma startup com ID, rodada e documentos.
2. Hypothesis: tese principal a validar/refutar.
3. Agent Profile: especialidade com prompt e peso.
4. Interaction Budget: créditos por ação do agente.
5. Ledger: trilha de auditoria completa de opiniões, ações e votos.
6. Autonomous Decision Making: agentes decidem autonomamente baseados em contexto completo (não hardcoded).

## 5) Prompt Adapter (SOUL.md)
Ordem de composição obrigatória:
1. `base_system`
2. `SOUL.md` global
3. `profile soul` (Debt/Tech/Market)
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
Entrega: API/CLI/Gateway sobem com comando único.
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

### Fase 6: Integração Agent Runtime
Objetivo: completar infraestrutura de agent runtime.
Entrega: mono-pi integration, prompt-adapter, tools, skills, orquestração básica.
Teste: build + tipos validados.

### Fase 6.5: Autonomia dos Agentes
Objetivo: transformar agentes em verdadeiramente autônomos.
Entrega:
- Remover lógica hardcoded (decideAction por iteração)
- Delegar decisões à LLM
- LLM decide ação baseada em contexto completo
- Resposta estruturada em JSON (opinion/message/vote/wait)
Teste: build passando, tipos validados.

### Fase 7: Integração LLM Real
Objetivo: substituir mocks por LLM real.
Entrega:
- Configurar API provider (OpenAI, Anthropic, etc.)
- Implementar integração mono-pi real
- Testar geração de decisões reais
- Validar parsing JSON de respostas
Teste: decisões funcionando com LLM real, não mock.

### Fase 8: Contexto Real em Agent Runtime
Objetivo: agentes usam dados reais da API.
Entrega:
- Fetch de documents da sessão
- Fetch de opinions anteriores
- Fetch de messages
- Fetch de votes
- Popular AutonomousAgentContext completo
Teste: contexto populado com dados reais da sessão.

### Fase 9: Gateway Orquestração
Objetivo: Gateway coordena 3 agentes automaticamente.
Entrega:
- Criar 3 worker threads (debt, tech, market)
- Loop de iterações (até convergência ou max)
- Coordenar execuções paralelas
- Tratamento de resultados
Teste: 3 agentes rodando em paralelo, decisões sendo feitas.

### Fase 10: Comando CLI analyze Real
**Objetivo:** `analyze --session <id>` funciona de verdade.
**Entrega:**
- CLI inicia análise automatizada
- Gateway orquestra agentes
- Agentes decidem autonomamente com contexto real
- Progresso visível em tempo real (WebSocket)
**Teste:** comando analyze inicia análise completa.

### Fase 11: Visualização Completa das Ações dos Agentes
**Objetivo:** painel abrangente no War Room para visualizar todas as ações dos agentes.
**Entrega:**
- Componente `AgentActionsPanel` com timeline detalhada
- Visualização de todas as ações: opinions, messages, votes, wait
- Exibição do texto completo das mensagens e opiniões
- Indicador de quando um agente está "esperando" (wait action)
- Marcação de mensagens lidas (read_at)
- Filtro por tipo de ação e por agente
- Timeline cronológica com timestamps precisos
- Integração com WebSocket para atualizações em tempo real
**Teste:** visualização completa de todas as ações de agentes em tempo real.

### Fase 12: Integrações Externas
Objetivo: adicionar canais externos sem mexer no core.
Entrega:
- SDK de adapter
- Integrações opcionais (Slack, WhatsApp, etc.)
- Export de resultados (CRM, etc.)
Teste: fluxo e2e completo por canal externo.

### Fase 13: Hardening (FINAL)
Objetivo: confiabilidade e segurança operacional em sistema completo.
Entrega:
- Retries automáticos em chamadas de LLM
- Observabilidade (metrics, logs, traces) em produção
- Timeout enforcement em orquestração real
- Rate limiting em API real
- Testes de resiliência em produção
Teste: cenários de falha (timeout, restart, desconexão) em sistema real.

## 10) Protocolo de desenvolvimento (obrigatório em toda fase)
1. Drafting: schema + interfaces + contratos.
2. Implementation: TypeScript estrito.
3. Dockerization: ambiente reproduzível.
4. Verification: executar comandos reais da fase antes de entregar.
5. Evidence: anexar checklist de teste com resultado.

## 11) Critérios de avanço entre fases
1. testes da fase atual verdes
2. demo curta reproduzível
3. nenhum blocker crítico aberto
4. dívida técnica registrada com prazo

## 12) Princípios de Evolução
1. **Hardening como ÚLTIMA fase**: Só implementar retries, rate limiting, observabilidade quando o sistema estiver completo e rodando com LLM real.
2. **Testes manuais antes de autônomos**: Validar toda infraestrutura (API, CLI, repositories) antes de adicionar complexidade de LLM.
3. **Incremento lógico**: LLM real → Contexto real → Orquestração → CLI → Hardening (não pular etapas).
4. **Validação por fase**: Cada fase entregue deve ter testes validando suas funcionalidades.
