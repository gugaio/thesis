# Arquitetura Geral - THESIS

## Visão Geral

THESIS (The Council) é uma plataforma de análise de VC orientada por múltiplos agentes, com debate estruturado, orçamento de interação e veredito final auditável. O sistema segue uma arquitetura em camadas com separação clara de responsabilidades entre aplicações e pacotes compartilhados.

## Diagrama de Arquitetura (Nível de Containers)

```mermaid
graph TB
    subgraph "External Users"
        Human[👤 Humano<br/>Investidor/Analista]
    end

    subgraph "Client Applications"
        WAR[thesis-war-room<br/>Dashboard<br/>Next.js]
        CLI[thesis-cli<br/>CLI Client<br/>Node.js]
    end

    subgraph "Backend Services"
        API[thesis-api<br/>Ledger API<br/>Fastify + WS]
        GW[thesis-gateway<br/>Orchestrator<br/>Node.js]
    end

    subgraph "Agent Runtime"
        ART[thesis-agent-runtime<br/>Agent Workers<br/>Worker Threads]
    end

    subgraph "Data Storage"
        DB[(PostgreSQL)]
    end

    subgraph "External Services"
        LLM[LLM API<br/>OpenAI/Anthropic/etc]
    end

    Human --> CLI
    Human --> WAR
    CLI -->|HTTP| API
    CLI -->|spawn analyze| GW
    WAR -->|WebSocket| API
    API -->|SQL| DB
    GW -->|HTTP/WebSocket| API
    GW -->|spawn| ART
    ART -->|WebSocket| API
    ART -->|HTTP| LLM

    style Human fill:#fff4e1
    style CLI fill:#e1f5ff
    style WAR fill:#e1f5ff
    style API fill:#ffe1f5
    style GW fill:#ffe1f5
    style ART fill:#ffe1f5
    style DB fill:#e0e0e0
    style LLM fill:#ffe0e0
```

## Diagrama de Componentes Detalhado

```mermaid
graph TB
    subgraph "THESIS MONOREPO"
        subgraph "Apps (Aplicações)"
            WR["thesis-war-room<br/>Dashboard<br/>Next.js + React"]
            API["thesis-api<br/>Ledger API<br/>Fastify + WS"]
            GW["thesis-gateway<br/>Orchestrator<br/>Worker Manager"]
            CLI["thesis-cli<br/>CLI Client<br/>Commander + axios"]
            ART["thesis-agent-runtime<br/>Agent Worker<br/>Worker Threads + Pi Moro"]
        end

        subgraph "Database"
            DB[("PostgreSQL<br/>Database")]
        end

        subgraph "External"
            LLM["LLM API<br/>Pi Moro Provider"]
        end

        WR <-->|WebSocket| API
        GW <-->|HTTP/WebSocket| API
        CLI -->|HTTP| API
        CLI -->|spawn analyze| GW
        API -->|SQL| DB
        GW -->|spawn| ART
        ART -->|WebSocket| API
        ART -->|API Calls| LLM
    end

    subgraph "Shared Packages"
        PRT["thesis/protocol<br/>Types & Events"]
        SKL["thesis/skills<br/>Agent Profiles"]
        PDA["thesis/prompt-adapter<br/>Prompt Composer"]
        TOL["thesis/tools<br/>Secure Bash Tools"]
    end

    API -.-> PRT
    GW -.-> PRT
    ART -.-> PRT
    CLI -.-> PRT
    SKL -.-> PRT
    PDA -.-> PRT
    TOL -.-> PRT

    ART --> SKL
    ART --> PDA
    ART --> TOL

    style WR fill:#e1f5ff
    style API fill:#fff4e1
    style GW fill:#fff4e1
    style CLI fill:#e1ffe1
    style ART fill:#ffe1f5
    style DB fill:#e0e0e0
    style LLM fill:#ffe0e0
    style PRT fill:#f0f0ff
    style SKL fill:#f0f0ff
    style PDA fill:#f0f0ff
    style TOL fill:#f0f0ff
```

## Dependências entre Packages

```mermaid
graph TD
    subgraph "Shared Packages"
        PRT["thesis/protocol<br/>Types & Events"]
        SKL["thesis/skills<br/>Agent Profiles"]
        PDA["thesis/prompt-adapter<br/>Prompt Composer"]
        TOL["thesis/tools<br/>Secure Bash Tools"]
    end

    API["thesis-api"]
    GW["thesis-gateway"]
    ART["thesis-agent-runtime"]
    CLI["thesis-cli"]
    WR["thesis-war-room"]

    API -->|imports| PRT
    API -->|imports| SKL
    GW -->|imports| PRT
    GW -->|imports| SKL
    ART -->|imports| PRT
    ART -->|imports| SKL
    ART -->|imports| PDA
    ART -->|imports| TOL
    CLI -->|imports| PRT
    CLI -->|imports| SKL
    WR -.->|WebSocket| API

    SKL -->|imports| PRT
    PDA -->|imports| PRT
    TOL -->|imports| PRT

    style PRT fill:#f0f0ff
    style SKL fill:#f0f0ff
    style PDA fill:#f0f0ff
    style TOL fill:#f0f0ff
```

## Aplicações (apps/)

### 1. thesis-api
**Porta:** 4000  
**Tecnologia:** Fastify + WebSocket + PostgreSQL

**Propósito:** API central que gerencia o ledger (livro-razão) da análise. É a fonte de verdade para todo o estado das sessões.

**Responsabilidades:**
- CRUD de sessões, hipóteses, documentos
- Gerenciamento de agentes e perfis
- Armazenamento de opiniões, votos, mensagens
- Ledger de eventos para auditoria completa
- WebSocket para tempo real (broadcast de eventos)
- Upload/download de documentos
- Relatórios e ranking de agentes

**Dependências:**
- `@thesis/protocol` - Tipos compartilhados
- `@thesis/skills` - Perfis de agentes pré-definidos
- `@fastify/websocket` - Comunicação em tempo real
- `pg` - Cliente PostgreSQL

---

### 2. thesis-gateway
**Tecnologia:** Node.js + WebSocket

**Propósito:** Orquestrador de múltiplos agentes. Gerencia o ciclo de vida dos workers de agentes e coordena sua comunicação com o sistema.

**Responsabilidades:**
- Spawn e gerenciamento de workers de agentes
- Balanceamento de carga entre agentes
- Coleta e agregação de resultados
- Respeito a limites de iteração e timeout
- Integração com API para controle da análise

**Dependências:**
- `@thesis/protocol` - Tipos compartilhados
- `@thesis/skills` - Configuração de perfis
- `ws` - Cliente WebSocket

---

### 3. thesis-agent-runtime
**Tecnologia:** Worker Threads + Pi Moro (@mariozechner/pi-agent-core)

**Propósito:** Runtime de execução individual de um agente. Cada agente roda em um worker separado e implementa o loop de decisão do Pi Moro.

**Responsabilidades:**
- Loop de decisão do Pi Moro
- Composição de prompts via Prompt Adapter
- Execução de ferramentas via @thesis/tools
- Publicação de opiniões na API
- Escuta e resposta a mensagens de outros agentes
- Gerenciamento de budget de interação
- Coleta de fatos para memória de longo prazo

**Dependências:**
- `@thesis/protocol` - Tipos de eventos/comandos
- `@thesis/skills` - Skills e perfis carregáveis
- `@thesis/prompt-adapter` - Composição de prompts
- `@thesis/tools` - Execução segura de comandos
- `@mariozechner/pi-agent-core` - Core do Pi Moro

---

### 4. thesis-cli
**Tecnologia:** Commander + axios

**Propósito:** Interface de linha de comando para operar o sistema. Usado tanto por humanos quanto por agentes externos.

**Responsabilidades:**
- `init-session` - Criar nova sessão de análise
- `upload-doc` - Subir documentos
- `join-session` - Entrar com perfil de agente
- `post-opinion` - Publicar opinião
- `ask` - Enviar mensagem para outro agente
- `listen` - Escutar mensagens (polling)
- `cast-vote` - Votar na sessão
- `close-session` - Encerrar com veredito
- `generate-report` - Gerar relatório JSON
- `analyze` - Executar análise completa

**Dependências:**
- `@thesis/protocol` - Tipos de requisições/respostas
- `@thesis/skills` - Lista de perfis disponíveis
- `thesis-gateway` - Para executar análise automática (comando `analyze`)

---

### 5. thesis-war-room
**Porta:** 3000  
**Tecnologia:** Next.js + React + Tailwind + Radix UI + Framer Motion

**Propósito:** Dashboard interativo em tempo real para monitoramento e análise de sessões de análise de VC.

**Responsabilidades:**
- Activity feed global com timeline de eventos de todas as sessões
- Visualização detalhada de agentes com identidade cards e badges de atividade
- Feed social com opiniões, mensagens, votos e documentos
- Filtros por tipo de agente (debt, tech, market, branding) e tipo de atividade
- Heatmap de atividade temporal para análise de padrões
- Gráficos e métricas com visualização de dados (recharts)
- Interface de voto interativa com dialog de confirmação
- Layout responsivo com grid bento para dashboards flexíveis
- Animações suaves e transições de página (framer-motion)
- Conexão WebSocket para atualizações em tempo real
- Estados de loading e empty states para melhor UX

**Dependências:**
- `next` - Framework React
- `react` / `react-dom` - Biblioteca React
- `lucide-react` - Ícones
- `recharts` - Gráficos e visualizações de dados
- `framer-motion` - Animações e transições
- `@radix-ui/*` - Componentes UI acessíveis (Dialog, DropdownMenu, Select, Tabs)
- `clsx` - Utilitário para classes condicionais
- `tailwind-merge` - Merge inteligente de classes Tailwind

---

## Pacotes Compartilhados (packages/)

### @thesis/protocol
**Propósito:** Contratos compartilhados de tipos, eventos e comandos. É a "lingua franca" entre todas as aplicações.

**Conteúdo:**
- `Session`, `Hypothesis`, `Document`, `Agent`
- `Opinion`, `Vote`, `Message`
- `LedgerEvent`, `EventType`, `CommandType`
- Enums: `SessionStatus`, `VerdictType`, `AgentRole`

**Por que existe:** Garante consistência de tipos em toda a base. Se um evento muda, todos os consumidores são notificados via TypeScript.

---

### @thesis/skills
**Propósito:** Definição de perfis de agentes e habilidades (skills) carregáveis.

**Conteúdo:**
- `AGENTS_CONFIG` - Configuração de perfis (debt, tech, market, branding)
- `AGENT_ROLES` - Lista de roles disponíveis
- `SkillsLoader` - Parser de arquivos markdown de skills
- Perfis pré-definidos com pesos e SOULs específicos

**Por que existe:** Permite que agentes especializados sejam facilmente criados e configurados sem modificar o core do sistema.

---

### @thesis/prompt-adapter
**Propósito:** Composição de prompts complexos para o LLM, seguindo o padrão SOUL.

**Ordem de Composição:**
1. `base_system` - Sistema base do Pi Moro
2. `SOUL.md` global - Valores globais do THESIS
3. `profile soul` - Valores específicos do perfil (ex: debt-focused)
4. `skills ativas` - Skills carregadas para o contexto
5. `runtime constraints` - Budget, política de tools, regras da sessão

**Por que existe:** Centraliza toda a lógica de prompt engineering e garante auditoria (snapshot do prompt final é salvo no ledger).

---

### @thesis/tools
**Propósito:** Registro e execução segura de ferramentas bash com allowlist.

**Ferramentas Padrão:**
- `ls` - Listar diretórios
- `cat` - Ler arquivos
- `rg` - Buscar conteúdo (ripgrep)
- `wc` - Contar linhas/palavras/bytes
- `head`/`tail` - Início/fim de arquivos
- `jq` - Processar JSON

**Características:**
- Allowlist configurável por sessão/agente
- Timeout por execução
- Limite de output em bytes
- Log completo no ledger

**Por que existe:** Fornece capacidades de investigação seguras para os agentes, sem dar acesso irrestrito ao sistema.

---

## Fluxo de Análise Completa

```mermaid
sequenceDiagram
    participant Human as Humano/CLI
    participant API as thesis-api
    participant GW as thesis-gateway
    participant ART1 as Agent 1<br/>(debt)
    participant ART2 as Agent 2<br/>(tech)
    participant ART3 as Agent 3<br/>(market)
    participant LLM as LLM Provider
    participant DB as PostgreSQL
    participant WR as thesis-war-room

    Human->>API: POST /sessions (init-session)
    API->>DB: INSERT session
    API->>DB: INSERT ledger event (session.created)
    API-->>Human: sessionId

    Human->>API: POST /documents (upload-doc)
    API->>DB: INSERT document
    API-->>Human: documentId

    Human->>GW: thesis analyze --session <id>
    GW->>API: POST /agents (join x3)
    API->>DB: INSERT agents
    API->>DB: INSERT ledger events (agent.joined x3)

    par Análise Paralela dos Agentes
        GW->>ART1: spawn worker
        GW->>ART2: spawn worker
        GW->>ART3: spawn worker
    end

    par Loop de Iterações
        ART1->>API: GET /sessions/:id
        API->>DB: SELECT session + documents
        DB-->>API: session data
        API-->>ART1: session

        ART1->>LLM: POST /chat (compose prompt)
        LLM-->>ART1: response

        ART1->>@thesis/tools: execute (rg, cat, etc)
        @thesis/tools-->>ART1: tool output

        ART1->>API: POST /opinions
        API->>DB: INSERT opinion
        API->>DB: INSERT ledger event (opinion.posted)
        API->>WR: broadcast WebSocket event
    end

    par Comunicação entre Agentes
        ART2->>API: POST /messages (ask @agent1)
        API->>DB: INSERT message
        API->>DB: UPDATE agent budget (debit credits)
        API->>WR: broadcast message event
        ART1->>API: GET /messages?unread=true
        API-->>ART1: new messages
    end

    Human->>CLI: thesis cast-vote --verdict approve
    CLI->>API: POST /votes
    API->>DB: INSERT vote
    API->>DB: INSERT ledger event (vote.cast)

    Human->>CLI: thesis close-session --verdict approve
    CLI->>API: POST /sessions/:id/close
    API->>DB: UPDATE session (status=closed)
    API->>DB: UPDATE agent rankings
    API->>DB: INSERT ledger event (session.closed)
    API->>WR: broadcast session.closed

    Human->>CLI: thesis generate-report
    CLI->>API: GET /sessions/:id/report
    API->>DB: SELECT all data
    API-->>CLI: full report (JSON)
```

## Padrão de Comunicação

### Event-Driven via Ledger
Toda ação no sistema gera um evento no ledger:

```typescript
// Exemplo de eventos
interface OpinionPostedEvent {
  type: 'opinion.posted';
  sessionId: string;
  agentId: string;
  opinionId: string;
  content: string;
  confidence: number;
  timestamp: Date;
}

interface SessionClosedEvent {
  type: 'session.closed';
  sessionId: string;
  finalVerdict: 'approve' | 'reject';
  timestamp: Date;
}
```

### WebSocket Broadcast
- API → War Room: Todos os eventos são broadcastados para clientes conectados
- API → Agent Runtime: Agentes escutam eventos relevantes para reagir

### REST API
- CLI → API: Comandos síncronos para operações CRUD
- Agent Runtime → API: POST de opiniões, votes, mensagens

---

## Estrutura de Dados

### Session
```mermaid
classDiagram
    class Session {
        +string id
        +SessionStatus status
        +Hypothesis hypothesis
        +VerdictType? finalVerdict
        +Date createdAt
        +Date updatedAt
        +Date? closedAt
        +Document[] documents
        +Agent[] agents
    }

    class Hypothesis {
        +string id
        +string statement
        +string description
        +number confidence
    }

    class Document {
        +string id
        +string name
        +string type
        +number size
        +Date uploadedAt
        +string contentHash
    }

    Session "1" *-- "1" Hypothesis
    Session "1" *-- "*" Document

    class SessionStatus {
        <<enumeration>>
        CREATED
        ACTIVE
        PAUSED
        CLOSED
    }

    class VerdictType {
        <<enumeration>>
        APPROVE
        REJECT
        ABSTAIN
    }

    Session --> SessionStatus
    Session --> VerdictType
```

### Agent
```mermaid
classDiagram
    class Agent {
        +string id
        +AgentProfile profile
        +Date joinedAt
        +boolean isActive
        +InteractionBudget budget
    }

    class AgentProfile {
        +string id
        +string name
        +string role
        +string description
        +number weight
        +string soul
    }

    class InteractionBudget {
        +number credits
        +number maxCredits
        +Date lastRefill
    }

    class AgentRole {
        <<enumeration>>
        DEBT
        TECH
        MARKET
        BRANDING
    }

    Agent "1" *-- "1" AgentProfile
    Agent "1" *-- "1" InteractionBudget
    AgentProfile --> AgentRole
```

## Princípios Arquiteturais

1. **Separação de Concerns:** Cada app tem responsabilidade única
2. **Tipo-First:** Protocolo define todos os tipos compartilhados
3. **Event Sourcing:** Ledger é fonte de verdade para histórico
4. **Isolation:** Cada agente roda em worker isolado
5. **Minimal Tools:** Só adiciona ferramentas quando necessário
6. **Phase-Based:** Evolução incremental por fases (Fase 0-7)
