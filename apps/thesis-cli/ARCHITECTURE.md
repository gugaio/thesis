# Arquitetura - THESIS CLI

## Visão Geral

O **thesis-cli** é a interface de linha de comando primária para o ecossistema THESIS. Ele serve como o ponto de entrada principal para usuários humanos e, em alguns casos, para automações externas. Construído sobre Node.js e Commander, ele oferece uma interface robusta para interagir com a API central (`thesis-api`) e orquestrar análises locais via `thesis-gateway`.

## Diagrama de Componentes

```mermaid
graph TB
    subgraph "thesis-cli"
        CMD["Command Definitions<br/>(Commander)"]
        Client["ApiClient<br/>(Axios Wrapper)"]
        Spawn["Process Spawner<br/>(child_process)"]
    end

    subgraph "External Systems"
        API["thesis-api<br/>(HTTP REST)"]
        GW["thesis-gateway<br/>(Local Process)"]
        FS["File System<br/>(Docs/Config)"]
    end

    CMD -->|Parse Args| Client
    CMD -->|Read Files| FS
    CMD -->|analyze command| Spawn
    
    Client -->|HTTP Request| API
    Spawn -->|fork/spawn| GW
    GW -->|WebSocket| API
```

## Estrutura do Código

A aplicação segue uma estrutura simples e direta, focada na definição de comandos e na abstração da comunicação com a API.

- **`src/index.ts`**: Ponto de entrada (Entrypoint). Define todos os comandos CLI usando `Commander.js`, valida os argumentos e invoca o `ApiClient`.
- **`src/client/api-client.ts`**: Camada de abstração para a `thesis-api`. Encapsula chamadas HTTP (Axios) e trata erros de rede, retornando tipos tipados definidos em `@thesis/protocol`.

### Class Diagram: ApiClient

```mermaid
classDiagram
    class ApiClient {
        -AxiosInstance client
        +constructor(baseUrl: string)
        +createSession(hypothesis: string): Promise<Session>
        +uploadDocument(sessionId: string, path: string): Promise<Doc>
        +joinSession(sessionId: string, profile: string): Promise<Agent>
        +postOpinion(sessionId: string, agentId: string, content: string): Promise<Opinion>
        +castVote(sessionId: string, agentId: string, verdict: string): Promise<Vote>
        +closeSession(sessionId: string, verdict: string): Promise<Session>
        +getReport(sessionId: string): Promise<Report>
        # ...outros métodos CRUD
    }

    class CommandHandler {
        +initSession()
        +uploadDoc()
        +joinSession()
        +analyze()
    }

    CommandHandler --> ApiClient : uses
```

## Fluxos de Execução Principais

### 1. Inicialização e Configuração de Sessão (Manual)

Este fluxo representa a interação humana padrão para preparar uma análise.

```mermaid
sequenceDiagram
    participant User
    participant CLI
    participant API
    participant FS as FileSystem

    User->>CLI: thesis init-session --hypothesis "X"
    CLI->>API: POST /sessions
    API-->>CLI: { sessionId: "123" }
    CLI-->>User: Session Created (123)

    User->>CLI: thesis upload-doc --session 123 --file ./pitch.pdf
    CLI->>FS: Read file stream
    CLI->>API: POST /sessions/123/documents (Generic Multipart)
    API-->>CLI: { documentId: "doc_1" }
    CLI-->>User: Document Uploaded
```

### 2. Análise Automatizada (`thesis analyze`)

Este comando é especial pois **não** apenas chama a API, mas inicia um sub-processo local que roda o `thesis-gateway`. Isso permite que o CLI atue como um "runner" portátil para análises.

```mermaid
sequenceDiagram
    participant User
    participant CLI
    participant Gateway as Child Process
    participant API

    User->>CLI: thesis analyze --session 123 --iterations 10
    CLI->>API: GET /sessions/123 (Validate Status)
    API-->>CLI: Session OK (Active)
    
    CLI->>Gateway: spawn('node thesis-gateway', [session, env...])
    
    note right of CLI: CLI agora atua como monitor do processo
    
    Gateway->>API: Connect WebSocket
    Gateway->>API: Spawn Agents (Debt, Tech, Market)
    
    loop Analysis Loop
        Gateway->>Gateway: Coordinate Agents
    end
    
    Gateway-->>CLI: Process Exit (0)
    CLI-->>User: Analysis Completed
```

### 3. Monitoramento de Mensagens (`thesis listen`)

O comando `listen` implementa um padrão de **Long Polling** (ou polling intervalado) para simular uma conexão em tempo real via terminal, permitindo que um usuário humano veja mensagens chegando para um agente específico.

```mermaid
sequenceDiagram
    participant User
    participant CLI
    participant API

    User->>CLI: thesis listen --session 123 --agent human_1
    
    loop Every X seconds
        CLI->>API: GET /sessions/123/messages?unread=true
        alt Has Messages
            API-->>CLI: [Message A, Message B]
            CLI-->>User: Print Messages
            CLI->>API: POST /messages/read (Ack)
        else No Messages
            API-->>CLI: []
            CLI-->>User: . (dot progress)
        end
        CLI->>CLI: sleep(interval)
    end
```

## Interação com Pacotes Compartilhados

O CLI depende fortemente dos pacotes compartilhados para garantir consistência de tipos e lógica de negócios:

- **`@thesis/protocol`**:
    - Usado para tipar todas as respostas da API (`Session`, `Document`, `Agent`).
    - Garante que o CLI saiba exatamente quais campos esperar e enviar.
    - Ex: `VerdictType`, `AgentRole`.

- **`@thesis/skills`**:
    - Usado para validar inputs locais antes mesmo de chamar a API.
    - Ex: O comando `join-session` valida se o `--profile` passado existe em `AGENT_ROLES` importado de `@thesis/skills`.

## Configuração e Variáveis de Ambiente

O CLI é configurado primariamente via variáveis de ambiente, que podem ser passadas diretamente ou carregadas de um `.env` (se suportado pelo runner).

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `API_URL` | `http://localhost:4000` | URL base da `thesis-api` |
| `WS_URL` | `ws://localhost:4000` | URL WebSocket (passada para gateway no `spawn`) |
| `PI_PROVIDER` | `openai` | Provider de LLM (para `analyze`) |
| `PI_MODEL` | `gpt-4o-mini` | Modelo LLM (para `analyze`) |
| `PI_API_KEY` | - | Chave de API do provider LLM |

## Detalhes de Implementação

### Tratamento de Erros
O `ApiClient` envolve todas as chamadas Axios em blocos try-catch que normalizam os erros. Se a API retornar um erro estruturado JSON (`{ error: "message" }`), o client extrai essa mensagem e lança um `Error` limpo para ser exibido no terminal, evitando stack traces desnecessários para o usuário final, a menos que seja um crash inesperado.

### Streams e Uploads
Para o upload de documentos (`upload-doc`), o CLI utiliza `fs.createReadStream` combinado com `form-data`. Isso é crucial para permitir o upload de arquivos grandes sem carregar todo o conteúdo em memória antes do envio, mantendo a pegada de memória do CLI baixa.
