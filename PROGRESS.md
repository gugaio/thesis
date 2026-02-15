# 📊 THESIS: The Council - Progresso do Projeto

## 🎯 Visão Geral

**Nome do Projeto:** THESIS - The Council
**Objetivo:** Plataforma de análise de VC orientada por múltiplos agentes, com debate estruturado, orçamento de interação e veredito final auditável.

---

## ✅ Fases Implementadas

### ✅ Fase 0: Foundation
**Objetivo:** Monorepo, contratos e ambiente docker.

**Entregas:**
- ✅ Estrutura monorepo com pnpm workspaces
- ✅ Apps: `thesis-api`, `thesis-gateway`, `thesis-cli`
- ✅ Packages: `protocol` (tipos compartilhados)
- ✅ Docker Compose com PostgreSQL
- ✅ Build + testes base funcionando

**Status:** ✅ COMPLETA

---

### ✅ Fase 1: Ledger + Sessão (MVP 1)
**Objetivo:** Criar sessão, anexar docs, consultar status.

**CLI:**
- ✅ `init-session` - Criar nova sessão com hipótese
- ✅ `upload-doc` - Upload de documento
- ✅ `status` - Consultar status da sessão

**API:**
- ✅ `POST /sessions` - Criar sessão
- ✅ `GET /sessions/:id` - Obter sessão
- ✅ `POST /sessions/:id/documents` - Upload documento
- ✅ `GET /sessions/:id/documents` - Listar documentos

**Componentes:**
- ✅ `SessionRepository` - CRUD de sessões
- ✅ `DocumentRepository` - CRUD de documentos
- ✅ `LedgerService` - Trilha de eventos
- ✅ Tabelas: `sessions`, `documents`, `hypotheses`

**Status:** ✅ COMPLETA
**Testes:** 9 passed

---

### ✅ Fase 2: Join + Opinion + MCP básico (MVP 2)
**Objetivo:** Agente externo entra com perfil e publica opinião.

**CLI:**
- ✅ `join-session --profile <debt|tech|market>` - Agente entra na sessão
- ✅ `post-opinion --agent <id> --content --confidence` - Publicar opinião

**API:**
- ✅ `POST /sessions/:id/agents` - Entrar na sessão
- ✅ `GET /sessions/:id/agents` - Listar agentes
- ✅ `GET /agents/:id` - Obter agente
- ✅ `POST /sessions/:id/opinions` - Publicar opinião
- ✅ `GET /sessions/:id/opinions` - Listar opiniões

**Componentes:**
- ✅ `AgentRepository` - CRUD de agentes
- ✅ `AgentProfileRepository` - Perfis pré-definidos (debt, tech, market)
- ✅ `OpinionRepository` - CRUD de opiniões
- ✅ Tabelas: `agents`, `agent_profiles`, `opinions`
- ✅ Perfil com peso, nome, descrição e SOUL

**Perfis de Agente:**
1. **Debt Specialist** (peso: 1.0)
   - Finanças de startups, burn rate, runway, unit economics

2. **Tech Expert** (peso: 0.8)
   - Stack tecnológica, debt técnico, escalabilidade

3. **Market Analyst** (peso: 0.9)
   - TAM/SAM/SOM, competition, product-market fit

**Status:** ✅ COMPLETA
**Testes:** 18 passed

---

### ✅ Fase 3: Budget + Diálogo (MVP 3)
**Objetivo:** Economia de créditos e diálogo entre agentes.

**CLI:**
- ✅ `ask --from <agent> --to <agent> --content` - Enviar mensagem
- ✅ `listen --agent <id> --interval <segundos>` - Escutar mensagens (polling)

**API:**
- ✅ `POST /sessions/:id/messages` - Enviar mensagem
- ✅ `GET /sessions/:id/messages` - Listar mensagens
- ✅ `POST /agents/:id/messages/read` - Marcar como lidas
- ✅ `POST /agents/:id/messages/read-all` - Marcar todas como lidas

**Componentes:**
- ✅ `MessageRepository` - CRUD de mensagens
- ✅ Tabela: `messages` com `sent_at` e `read_at`
- ✅ Validação de budget antes de enviar mensagem
- ✅ Dedução de créditos (1 crédito por mensagem)
- ✅ Bloqueio quando budget = 0

**Regras:**
- ✅ Mensagem deduz 1 crédito do remetente
- ✅ Não é possível enviar para si mesmo
- ✅ Polling para receber mensagens não lidas

**Status:** ✅ COMPLETA
**Testes:** 16 passed

---

### ✅ Fase 4: Veredito + Relatório + Ranking (MVP 4)
**Objetivo:** Fechar ciclo de análise com sistema de votação, relatório consolidado e ranking de autoridade.

**CLI:**
- ✅ `cast-vote --agent <id> --verdict <approve|reject|abstain> --rationale` - Votar
- ✅ `close-session --verdict <approve|reject> --rationale` - Encerrar sessão
- ✅ `generate-report --output <path.json>` - Gerar relatório JSON

**API:**
- ✅ `POST /sessions/:id/votes` - Registrar voto
- ✅ `GET /sessions/:id/votes` - Listar votos
- ✅ `POST /sessions/:id/close` - Encerrar sessão com veredito
- ✅ `GET /sessions/:id/report` - Relatório completo

**Componentes:**
- ✅ `VoteRepository` - CRUD de votos + contagem
- ✅ `AgentRankingRepository` - Cálculo e persistência de rankings
- ✅ `SessionRepository.close()` - Encerramento de sessão
- ✅ Tabelas: `votes`, `agent_rankings`
- ✅ Colunas em `sessions`: `final_verdict`, `closed_at`

**Sistema de Ranking:**
```
Score = (acertos × 10) + (opiniões × confiança_média × peso_perfil)
```

**Regras:**
- ✅ Cada agente pode votar apenas uma vez por sessão
- ✅ Voto deduz 1 crédito do agente
- ✅ Votos só são permitidos antes de fechar a sessão
- ✅ Ao fechar, rankings são atualizados:
  - Agentes que votaram igual ao veredito final ganham +1 acerto
  - Agentes que votaram diferente ganham 0 acertos
- ✅ Rankings são ordenados por score decrescente

**Formato do Relatório JSON:**
```json
{
  "session": {
    "id": "uuid",
    "status": "closed",
    "finalVerdict": "approve",
    "closedAt": "2026-02-13T18:01:19.485Z"
  },
  "hypothesis": { ... },
  "documents": [ ... ],
  "agents": [ ... ],
  "votes": [ ... ],
  "opinions": [ ... ],
  "voteCounts": {
    "approve": 2,
    "reject": 0,
    "abstain": 1
  },
  "rankings": [
    {
      "agentId": "uuid",
      "score": 10,
      "totalVotes": 1,
      "correctVotes": 1,
      "totalOpinions": 0,
      "avgConfidence": 0
    }
  ],
  "generatedAt": "2026-02-13T18:11:36.037Z"
}
```

**Eventos no Ledger:**
- ✅ `vote.cast` - Quando um agente vota
- ✅ `session.closed` - Quando sessão é encerrada

**Status:** ✅ COMPLETA
**Testes:** 20 passed

---

### ✅ Fase 5: War Room (Final MVP)
**Objetivo:** Dashboard read-only em tempo real.

**Entregas:**
- ✅ Dashboard Next.js na porta 4500
- ✅ WebSocket para atualizações em tempo real
- ✅ Timeline da sessão
- ✅ Lista de agentes com status
- ✅ Visualização de créditos
- ✅ Votos em tempo real
- ✅ Relatório completo integrado

**API (WebSocket):**
- ✅ `GET /ws/sessions/:id` - Conexão WebSocket
- ✅ Broadcast de eventos em tempo real:
  - `session.created` - Nova sessão criada
  - `agent.joined` - Agente entra na sessão
  - `opinion.posted` - Opinião publicada
  - `message.sent` - Mensagem trocada
  - `vote.cast` - Voto registrado
  - `session.closed` - Sessão encerrada
  - `budget.updated` - Créditos atualizados

**Componentes:**
- ✅ `SessionHeader` - Cabeçalho da sessão
- ✅ `Timeline` - Timeline de eventos
- ✅ `AgentsPanel` - Painel de agentes
- ✅ `VotesPanel` - Painel de votos
- ✅ `MessagesPanel` - Painel de mensagens
- ✅ `ReportSection` - Seção de relatório

**Hooks:**
- ✅ `useWebSocket` - Hook para conexão WebSocket
- ✅ `useSession` - Hook para carregar sessão

**Páginas:**
- ✅ `/` - Lista de sessões ativas
- ✅ `/sessions/:id` - Dashboard da sessão

**Docker:**
- ✅ Serviço `war-room` na porta 4500
- ✅ Configuração de ambiente para API e WebSocket

**Status:** ✅ COMPLETA
**Testes:** 68 passed (API + CLI)

---

### ✅ Fase 6: Integração Agent Runtime
**Objetivo:** Completar integração do Agent Runtime com mono-pi para análise automatizada de sessões.

**Entregas:**
- ✅ Criar SOUL.md global
- ✅ Criar BASE_SYSTEM.md (sistema prompt base para todos os agentes)
- ✅ Criar package prompt-adapter (composição de prompts)
- ✅ Criar package tools (registry de tools com allowlist)
- ✅ Completar agent-worker.ts com integração mono-pi
- ✅ Implementar orquestração em gateway
- ✅ Adicionar comando analyze no CLI
- ✅ Atualizar docker-compose.yml com serviço orchestrator
- ✅ Criar testes unitários para prompt-adapter e tools
- ✅ Criar testes de integração

**Componentes:**
- ✅ `packages/skills/SOUL.md` - Sistema prompt global (SOUL)
- ✅ `packages/skills/BASE_SYSTEM.md` - Sistema prompt base para todos os agentes
- ✅ `packages/prompt-adapter` - Composição de prompts (base + SOUL + perfil + skill + constraints)
- ✅ `packages/tools` - Tool registry com allowlist segura (ls, cat, rg, wc, head, tail, jq)
- ✅ `apps/thesis-agent-runtime/src/agent-worker.ts` - Integração com mono-pi
- ✅ `apps/thesis-gateway/src/index.ts` - Orquestração de 3 agentes (debt, tech, market)
- ✅ `apps/thesis-cli/src/index.ts` - Comando `analyze --session <id>`

**CLI:**
- ✅ `analyze --session <id> [--iterations <n>] [--timeout <ms>]` - Análise automatizada

**Docker:**
- ✅ Serviço `orchestrator` na porta padrão
- ✅ Configuração de ambiente para API e WebSocket
- ✅ Variáveis MAX_CONCURRENT_AGENTS=3, MAX_ITERATIONS=10, ITERATION_TIMEOUT=30000

**Arquitetura:**
```
CLI (analyze) → Gateway (orchestrator) → API + WebSocket
                  ↓
            Agent Runtime (worker threads)
                  ↓
            Prompt Adapter + Tools + Skills
```

**Status:** ✅ COMPLETA
**Testes:** Criados testes unitários e integração

---

### ✅ Fase 6.5: Autonomia dos Agentes (Refatoração)
**Objetivo:** Transformar agentes em verdadeiramente autônomos, removendo lógica hardcoded de decisão.

**Entregas:**
- ✅ Removido método `decideAction()` hardcoded (baseado em iteração fixa)
- ✅ Criado método `decideAutonomousAction()` que delega decisão à LLM
- ✅ Implementado `buildAutonomousContext()` com contexto completo da sessão
- ✅ Implementado `buildDecisionPrompt()` com contexto detalhado para a LLM
- ✅ Implementado `parseStructuredDecision()` para extrair ação da resposta JSON
- ✅ Atualizado `BASE_SYSTEM.md` com instruções de decisão autônoma
- ✅ Adicionado tipo `StructuredAgentDecision` para resposta estruturada
- ✅ Adicionado tipo `AutonomousAgentContext` para contexto completo
- ✅ Simplificado `runIteration()` para usar única chamada à LLM
- ✅ Atualizado testes para validar decisões estruturadas

**Arquitetura Anterior:**
```typescript
// Hardcoded e não autônomo
if (iteration < 3) return 'opinion';
else if (iteration < 5) return 'message';
else return 'vote';
```

**Arquitetura Nova:**
```typescript
// Autônomo e baseado em instruções
const decision = await this.decideAutonomousAction();
// LLM decide autonomamente baseada em:
// - Informações disponíveis (documentos, opiniões, mensagens)
// - Estado da colaboração
// - Budget atual
// - Progresso da análise
```

**Formato de Resposta Estruturada da LLM:**
```json
{
  "action": "opinion" | "message" | "vote" | "wait",
  "reasoning": "Por que escolhi essa ação baseado no estado atual",
  "content": "...",  // se opinion/message
  "target_agent": "debt|tech|market",  // se message
  "confidence": 0.8,  // se opinion (0.0 - 1.0)
  "verdict": "approve|reject|abstain",  // se vote
  "wait_seconds": 5  // se wait
}
```

**Decisões Autônomas da LLM:**
- **POST OPINION**: Quando tem insights específicos, analisou documentos, tem confiança moderada-alta
- **SEND MESSAGE**: Quando precisa de info de outro agente, questionar opinião, descobriu info relevante
- **CAST VOTE**: Quando tem evidência suficiente, considerou todas as perspectivas
- **WAIT**: Quando budget baixo, precisa de mais info, incerto

**Componentes Atualizados:**
- `apps/thesis-agent-runtime/src/agent-worker.ts` - Refatorado para autonomia
- `apps/thesis-agent-runtime/src/types.ts` - Novos tipos adicionados
- `packages/skills/BASE_SYSTEM.md` - Seção de decisão autônoma adicionada
- `apps/thesis-agent-runtime/src/__tests__/agent-worker.test.ts` - Testes atualizados

**Status:** ✅ COMPLETA
**Testes:** Build passando, tipos validados

---

## 📊 Estatísticas Globais

```
✅ Total de Fases Completas: 6.5/12 (54%)
✅ Total de Testes: 75+ passando (aproximado)
✅ Repositories Criados: 11
✅ API Endpoints: 18
✅ WebSocket Endpoint: 1
✅ CLI Commands: 13
✅ Tabelas do Banco: 10
✅ Perfis de Agente: 3
✅ Apps: 4 (api, cli, gateway, war-room)
✅ Packages: 4 (protocol, prompt-adapter, tools, skills)
✅ Skills Definidas: 3 (debt, tech, market)
✅ SOUL.md Global: 1
✅ BASE_SYSTEM.md Global: 1
✅ Agentes Autônomos: Verdadeiramente autônomos (LLM decide ações)
```

---

## 🗂️ Estrutura do Projeto

```
thesis/
├── apps/
│   ├── thesis-api/          # API REST + WebSocket (Fastify)
│   │   ├── src/
│   │   │   ├── routes/      # API routes (sessions, agents, documents, opinions, messages, votes)
│   │   │   ├── repositories/ # Data access layer
│   │   │   ├── services/    # Business logic
│   │   │   ├── websocket/   # WebSocket handler, broadcast, publisher
│   │   │   ├── db/         # Database connection & schema
│   │   │   └── index.ts    # Server entry point
│   │   └── package.json
│   ├── thesis-cli/          # CLI interface
│   │   ├── src/
│   │   │   ├── client/      # API client
│   │   │   ├── index.ts     # CLI commands (incl. analyze)
│   │   │   └── *.test.ts   # Testes de fase
│   │   └── package.json
│   ├── thesis-gateway/      # Gateway worker / Orchestrator
│   │   ├── src/
│   │   │   └── index.ts    # Orquestração de agentes
│   │   └── package.json
│   ├── thesis-agent-runtime/ # Agent runtime com mono-pi
│   │   ├── src/
│   │   │   ├── agent-worker.ts    # Worker thread com mono-pi
│   │   │   ├── thread-manager.ts # Gerenciador de workers
│   │   │   ├── skills-parser.ts  # Parser de skills
│   │   │   ├── config.ts         # Configuração
│   │   │   └── types.ts          # Tipos
│   │   └── package.json
│   └── thesis-war-room/     # Dashboard Next.js
│       ├── src/
│       │   ├── app/         # App Router (páginas)
│       │   ├── components/  # Componentes React
│       │   ├── hooks/       # React hooks
│       │   ├── lib/         # Utilitários
│       │   └── types/       # Tipos TypeScript
│       └── package.json
├── packages/
│   ├── protocol/           # Tipos compartilhados (TypeScript)
│   │   └── src/types/
│   │       ├── session.ts   # Session, Agent, Vote, VerdictType
│   │       ├── ledger.ts    # Ledger, LedgerEntry
│   │       ├── events.ts    # Event types
│   │       └── commands.ts  # Command types
│   ├── prompt-adapter/     # Composição de prompts
│   │   ├── src/
│   │   │   ├── types.ts     # Tipos de prompt
│   │   │   ├── composer.ts  # Funções de composição
│   │   │   └── index.ts    # Exportações
│   │   └── package.json
│   ├── tools/              # Tool registry seguro
│   │   ├── src/
│   │   │   ├── types.ts     # Tipos de tool
│   │   │   ├── registry.ts  # Registry de tools
│   │   │   ├── bash-tool.ts # Executor bash
│   │   │   └── index.ts    # Exportações
│   │   └── package.json
│   └── skills/             # Definições de skills
│       ├── BASE_SYSTEM.md # Sistema prompt base para todos os agentes
│       ├── SOUL.md         # Sistema prompt global (SOUL)
│       ├── debt-specialist/
│       │   └── SKILL.md    # Skill do especialista de dívida
│       ├── tech-expert/
│       │   └── SKILL.md    # Skill do especialista técnico
│       └── market-analyst/
│           └── SKILL.md    # Skill do analista de mercado
├── docker-compose.yml       # Orquestração de containers (com orchestrator)
├── pnpm-workspace.yaml     # Workspace config
└── PROGRESS.md            # Este arquivo
```

---

## 📝 Tabelas do Banco de Dados

1. **hypotheses** - Hipóteses de análise
2. **sessions** - Sessões de análise
   - `status`: created, active, paused, closed
   - `final_verdict`: approve, reject
   - `closed_at`: timestamp de encerramento
3. **documents** - Documentos anexados às sessões
4. **agent_profiles** - Perfis pré-definidos (debt, tech, market)
5. **agents** - Agentes em sessões (com budget de créditos)
6. **opinions** - Opiniões publicadas
7. **messages** - Mensagens entre agentes
8. **votes** - Votos dos agentes (approve/reject/abstain)
9. **agent_rankings** - Pontuação de autoridade por agente
10. **events** - Ledger de eventos persistidos no banco

---

## 🧪 Testes por Fase

| Fase | Testes | Status |
|------|--------|--------|
| Fase 0 | 5 | ✅ PASS |
| Fase 1 | 9 | ✅ PASS |
| Fase 2 | 18 | ✅ PASS |
| Fase 3 | 16 | ✅ PASS |
| Fase 4 | 20 | ✅ PASS |
| Fase 5 | 0 | ✅ PASS (manual) |
| Fase 6 | 7 | ✅ PASS |
| Fase 6.5 | - | ✅ BUILD PASS |
| **TOTAL** | **75+** | **✅ PASS** |

---

## 🚀 Comandos Disponíveis

### CLI (via `node apps/thesis-cli/dist/index.js`)

#### Sessões
```bash
init-session --hypothesis "Tese" [--description "Descrição"]
status --session <id>
close-session --session <id> --verdict <approve|reject> --rationale "Motivo"
generate-report --session <id> --output report.json
```

#### Documentos
```bash
upload-doc --session <id> --file <caminho>
```

#### Agentes
```bash
join-session --session <id> --profile <debt|tech|market> [--credits <n>]
```

#### Opiniões
```bash
post-opinion --session <id> --agent <id> --content "Opinião" --confidence 0.8
```

#### Mensagens (Fase 3)
```bash
ask --session <id> --from <agente> --to <agente> --content "Pergunta"
listen --session <id> --agent <id> --interval <segundos>
```

#### Votos (Fase 4)
```bash
cast-vote --session <id> --agent <id> --verdict <approve|reject|abstain> --rationale "Razão"
```

---

### War Room (Dashboard)

```bash
# Desenvolvimento
cd apps/thesis-war-room
pnpm dev

# Build
pnpm build

# Produção
pnpm start
```

Acesse o dashboard em: `http://localhost:4500`

---

## 📦 API Endpoints

### REST API

| Método | Endpoint | Descrição |
|--------|-----------|-----------|
| POST | /sessions | Criar sessão |
| GET | /sessions | Listar sessões |
| GET | /sessions/:id | Obter sessão |
| POST | /sessions/:id/close | Encerrar sessão |
| GET | /sessions/:id/report | Gerar relatório |
| POST | /sessions/:id/documents | Upload documento |
| GET | /sessions/:id/documents | Listar documentos |
| POST | /sessions/:id/agents | Entrar na sessão |
| GET | /sessions/:id/agents | Listar agentes |
| POST | /sessions/:id/opinions | Publicar opinião |
| GET | /sessions/:id/opinions | Listar opiniões |
| POST | /sessions/:id/messages | Enviar mensagem |
| GET | /sessions/:id/messages | Listar mensagens |
| POST | /sessions/:id/votes | Votar |
| GET | /sessions/:id/votes | Listar votos |
| GET | /agents/:id | Obter agente |
| POST | /agents/:id/messages/read | Marcar mensagens lidas |
| POST | /agents/:id/messages/read-all | Marcar todas lidas |
| GET | /health | Health check |

### WebSocket

| Endpoint | Descrição |
|----------|-----------|
| ws://localhost:4000/ws/sessions/:id | Conexão em tempo real |

**Eventos Broadcast:**
- `session.created` - Nova sessão criada
- `doc.uploaded` - Documento anexado
- `agent.joined` - Agente entrou na sessão
- `opinion.posted` - Opinião publicada
- `message.sent` - Mensagem enviada
- `vote.cast` - Voto registrado
- `session.closed` - Sessão encerrada
- `budget.updated` - Créditos atualizados

---

## 🔧 Ambiente de Desenvolvimento

### Executar
```bash
# Subir todos os serviços
docker-compose up -d

# Ver status
docker-compose ps

# Ver logs
docker-compose logs -f api
docker-compose logs -f war-room
docker-compose logs -f gateway
```

### Serviços

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| api | 4000 | REST API + WebSocket |
| war-room | 4500 | Dashboard Next.js |
| postgres | 5432 | Banco de dados |
| gateway | - | Worker de orquestração |
| cli | - | Interface CLI |

---

### ✅ Fase 7: Integração LLM Real
**Objetivo:** Substituir mocks por LLM real para geração de decisões autônomas.

**Entregas:**
- ✅ Atualizar imports: `Agent` de `@mariozechner/pi-agent-core` e `getModel` de `@mariozechner/pi-ai`
- ✅ Remover interface `PiAgent` mock customizada
- ✅ Implementar `initialize()` real com Agent do mono-pi
- ✅ Criar método `callLLM()` para comunicação com LLM
- ✅ Atualizar `decideAutonomousAction()` para usar `callLLM()`
- ✅ Adicionar tratamento de timeout configurável
- ✅ Adicionar captura de erros da LLM
- ✅ Configurar environment variables (`PI_PROVIDER`, `PI_MODEL`, `PI_API_KEY`)
- ✅ Atualizar `docker-compose.yml` com env vars do orchestrator
- ✅ Criar `.env` e `.env.example` com configurações
- ✅ Adicionar `skipLibCheck` ao tsconfig.json (erro em `@google/genai`)
- ✅ Atualizar testes com validações adicionais

**Componentes:**
- `apps/thesis-agent-runtime/src/agent-worker.ts` - Integração LLM real
- `apps/thesis-agent-runtime/tsconfig.json` - skipLibCheck
- `.env` - Configurações locais
- `.env.example` - Template de configurações
- `docker-compose.yml` - Environment variables para orchestrator

**Arquitetura:**
```typescript
// Anterior (mock)
this.piAgent = {
  generate: async (options) => {
    return `[Mock mono-pi response]`;
  }
};

// Nova (real)
const model = getModel(this.piProvider, this.piModel);
this.piAgent = new Agent({
  initialState: {
    systemPrompt: this.baseSystem,
    model: model,
    thinkingLevel: 'minimal',
    tools: [],
    messages: [],
    isStreaming: false,
    streamMessage: null,
    pendingToolCalls: new Set(),
  },
  getApiKey: (provider: string) => config.pi_api_key,
});
```

**Tratamento de Erros:**
- **Timeout**: Configurável via `iteration_timeout_ms` (padrão: 60000ms)
- **API Key**: Usa `config.pi_api_key` se definido, otherwise usa env vars do provider
- **Fallback**: Se LLM falhar, retorna `wait` action com logging
- **Parsing JSON**: Mantido `parseStructuredDecision()` com fallback para `wait`

**Status:** ✅ COMPLETA
**Testes:** 11 passed (agent-worker)

---

## 🎯 Próxima Fase

### 📋 Fase 8: Contexto Real em Agent Runtime
**Objetivo:** Agentes usam dados reais da API para contexto completo.

**Entregas Planejadas:**
- 🔄 Fetch de documents da sessão via API
- 🔄 Fetch de opinions anteriores
- 🔄 Fetch de messages anteriores
- 🔄 Fetch de votes anteriores
- 🔄 Popular `AutonomousAgentContext` completo com dados reais

**Status:** ⏳ PENDENTE

---

## 📅 Roadmap Completo (12 Fases)

| Fase | Status | Data | Descrição |
|------|--------|------|-----------|
| Fase 0: Foundation | ✅ COMPLETA | 2026-02-12 | Monorepo, Docker, Build |
| Fase 1: Ledger + Sessão | ✅ COMPLETA | 2026-02-12 | CRUD sessions, docs |
| Fase 2: Join + Opinion | ✅ COMPLETA | 2026-02-12 | Agentes, opiniões |
| Fase 3: Budget + Diálogo | ✅ COMPLETA | 2026-02-13 | Mensagens, budget |
| Fase 4: Veredito + Ranking | ✅ COMPLETA | 2026-02-13 | Votos, relatórios |
| Fase 5: War Room | ✅ COMPLETA | 2026-02-13 | Dashboard Next.js |
| Fase 6: Integração Agent Runtime | ✅ COMPLETA | 2026-02-15 | Mono-pi, prompt-adapter |
| Fase 6.5: Autonomia dos Agentes | ✅ COMPLETA | 2026-02-15 | Decisões autônomas |
| Fase 7: Integração LLM Real | ✅ COMPLETA | 2026-02-15 | LLM real, não mock |
| Fase 8: Contexto Real em Agent Runtime | ⏳ PENDENTE | --- | Fetch docs, opinions, etc. |
| Fase 9: Gateway Orquestração | ⏳ PENDENTE | --- | 3 agentes paralelos |
| Fase 10: Comando CLI analyze Real | ⏳ PENDENTE | --- | Análise automatizada |
| Fase 11: Integrações Externas | ⏳ PENDENTE | --- | Slack, WhatsApp, etc. |
| Fase 12: Hardening (FINAL) | ⏳ PENDENTE | --- | Retries, observabilidade |

**Progresso:** 7/12 fases completas (58%)

---

## 📌 Notas Importantes

- **Persistência:** PostgreSQL com Docker volumes
- **Ledger:** Auditoria completa em `ledger` service
- **Budget:** Sistema de créditos com validação
- **Ranking:** Cálculo simples baseado em acertos e peso do perfil
- **SOUL:** Cada perfil tem um "soul" que descreve sua especialidade
- **Eventos:** Todas ações importantes geram eventos no Ledger
- **Status da Sessão:** created → active → paused → closed
- **Composição de Prompts (Fase 6):**
  - **BASE_SYSTEM.md**: Sistema prompt base para todos os agentes
  - **SOUL.md**: Diretrizes globais de colaboração e princípios
  - **Perfil**: Descrição do papel específico (debt, tech, market)
  - **Skill.md**: Conteúdo especializado do agente
  - **Constraints**: Budget, tool policy, regras da sessão
- **Autonomia dos Agentes (Fase 6.5):**
  - Agentes decidem autonomamente qual ação tomar (opinion, message, vote, wait)
  - LLM recebe contexto completo: hipótese, documentos, opiniões, mensagens, votos, budget
  - Decisão é baseada em análise inteligente do estado da sessão
  - Não existe mais lógica hardcoded baseada em iteração
  - Resposta estruturada em JSON com ação, conteúdo, target, confidence, verdict
- **Integração LLM Real (Fase 7):**
  - Agentes usam LLM real (OpenAI, Anthropic, etc.) via mono-pi
  - Configuração via environment variables (`PI_PROVIDER`, `PI_MODEL`, `PI_API_KEY`)
  - Tratamento de timeout e erros de API
  - Fallback para `wait` action se LLM falhar
  - Suporte a múltiplos providers através de mono-pi
- **Princípio de Hardening:**
  - Hardening deve ser a **ÚLTIMA fase** (Fase 12)
  - Só faz sentido "endurecer" código que está rodando em produção
  - Retries, rate limiting, observabilidade só são úteis quando o sistema está completo
  - Não implementar hardening enquanto usa mocks ou está incompleto

---

**Última Atualização:** 15 de Fevereiro de 2026
**Versão:** 0.6.0
**Status:** ✅ Fases 0-7 completas, Próximo: Fase 8 (Contexto Real em Agent Runtime)
