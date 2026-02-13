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

## 📊 Estatísticas Globais

```
✅ Total de Fases Completas: 4/4
✅ Total de Testes: 68/68 passando
✅ Repositories Criados: 9
✅ API Endpoints: 18
✅ CLI Commands: 12
✅ Tabelas do Banco: 8
✅ Perfis de Agente: 3
```

---

## 🗂️ Estrutura do Projeto

```
thesis/
├── apps/
│   ├── thesis-api/          # API REST (Fastify)
│   │   ├── src/
│   │   │   ├── routes/      # API routes (sessions, agents, documents, opinions, messages, votes)
│   │   │   ├── repositories/ # Data access layer
│   │   │   ├── services/    # Business logic
│   │   │   ├── db/         # Database connection & schema
│   │   │   └── index.ts    # Server entry point
│   │   └── package.json
│   ├── thesis-cli/          # CLI interface
│   │   ├── src/
│   │   │   ├── client/      # API client
│   │   │   ├── index.ts     # CLI commands
│   │   │   └── *.test.ts   # Testes de fase
│   │   └── package.json
│   └── thesis-gateway/      # Gateway worker
│       └── package.json
├── packages/
│   └── protocol/           # Tipos compartilhados (TypeScript)
│       └── src/types/
│           ├── session.ts   # Session, Agent, Vote, VerdictType
│           ├── ledger.ts    # Ledger, LedgerEntry
│           ├── events.ts    # Event types
│           └── commands.ts  # Command types
├── docker-compose.yml       # Orquestração de containers
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

---

## 🧪 Testes por Fase

| Fase | Testes | Status |
|------|--------|--------|
| Fase 0 | 5 | ✅ PASS |
| Fase 1 | 9 | ✅ PASS |
| Fase 2 | 18 | ✅ PASS |
| Fase 3 | 16 | ✅ PASS |
| Fase 4 | 20 | ✅ PASS |
| **TOTAL** | **68** | **✅ PASS** |

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

## 📦 API Endpoints

| Método | Endpoint | Descrição |
|--------|-----------|-----------|
| POST | /sessions | Criar sessão |
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

---

## 🎯 Próxima Fase

### 📋 Fase 5: War Room (Final MVP)
**Objetivo:** Dashboard read-only em tempo real.

**Entregas Planejadas:**
- 📊 Dashboard Next.js
- 🔄 WebSocket para atualizações em tempo real
- 📈 Timeline da sessão
- 🤖 Lista de agentes com status
- 💰 Visualização de créditos
- 🗳️ Votos em tempo real
- 📄 Relatório completo integrado

**Status:** ⏳ PENDENTE

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
docker-compose logs -f gateway
```

### Testes
```bash
# Testes CLI
cd apps/thesis-cli
npm test

# Testes API
cd apps/thesis-api
npm test
```

### Build
```bash
# Build de todos os packages
pnpm --filter @thesis/api build
pnpm --filter @thesis/cli build
pnpm --filter @thesis/gateway build
pnpm --filter @thesis/protocol build
```

---

## 📌 Notas Importantes

- **Persistência:** PostgreSQL com Docker volumes
- **Ledger:** Auditoria completa em `ledger` service
- **Budget:** Sistema de créditos com validação
- **Ranking:** Cálculo simples baseado em acertos e peso do perfil
- **SOUL:** Cada perfil tem um "soul" que descreve sua especialidade
- **Eventos:** Todas ações importantes geram eventos no Ledger
- **Status da Sessão:** created → active → paused → closed

---

## 📅 Cronograma

| Fase | Status | Data |
|------|--------|------|
| Fase 0: Foundation | ✅ COMPLETA | 2026-02-12 |
| Fase 1: Ledger + Sessão | ✅ COMPLETA | 2026-02-12 |
| Fase 2: Join + Opinion | ✅ COMPLETA | 2026-02-12 |
| Fase 3: Budget + Diálogo | ✅ COMPLETA | 2026-02-13 |
| Fase 4: Veredito + Ranking | ✅ COMPLETA | 2026-02-13 |
| Fase 5: War Room | ⏳ PENDENTE | --- |
| Fase 6: Hardening | ⏳ PENDENTE | --- |
| Fase 7: Integrações Externas | ⏳ PENDENTE | --- |

---

**Última Atualização:** 13 de Fevereiro de 2026  
**Versão:** 0.1.0  
**Status:** ✅ Fases 0-4 completas, prontas para Fase 5
