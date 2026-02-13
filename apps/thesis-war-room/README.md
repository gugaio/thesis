# THESIS War Room

Dashboard em tempo real para monitorar sessões de análise VC da plataforma THESIS.

## Tecnologias

- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utility-first
- **Lucide React** - Ícones
- **WebSocket** - Comunicação em tempo real

## Desenvolvimento

```bash
# Instalar dependências
pnpm install

# Executar em modo desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Executar em produção
pnpm start

# Lint
pnpm lint
```

## Variáveis de Ambiente

| Variável | Descrição | Valor padrão |
|----------|-----------|--------------|
| PORT | Porta do servidor | 4500 |
| NEXT_PUBLIC_API_URL | URL da API THESIS | http://localhost:4000 |
| NEXT_PUBLIC_WS_URL | URL do WebSocket | ws://localhost:4000 |

## Estrutura

```
src/
├── app/                    # App Router (Next.js 15)
│   ├── layout.tsx          # Layout raiz
│   ├── page.tsx            # Lista de sessões
│   ├── sessions/
│   │   └── [id]/
│   │       └── page.tsx    # Dashboard da sessão
│   └── globals.css         # Estilos globais
├── components/             # Componentes React
│   ├── SessionHeader.tsx   # Cabeçalho da sessão
│   ├── Timeline.tsx        # Timeline de eventos
│   ├── AgentsPanel.tsx     # Painel de agentes
│   ├── VotesPanel.tsx      # Painel de votos
│   ├── MessagesPanel.tsx   # Painel de mensagens
│   └── ReportSection.tsx   # Seção de relatório
├── hooks/                  # React hooks
│   ├── useWebSocket.ts     # Hook para WebSocket
│   └── useSession.ts       # Hook para carregar sessão
├── lib/                    # Utilitários
│   ├── api.ts              # Cliente da API
│   └── utils.ts            # Funções utilitárias
└── types/                  # Tipos TypeScript
    └── index.ts            # Definições de tipos
```

## Funcionalidades

### Lista de Sessões

- Listar todas as sessões ativas
- Mostrar status, veredito e data de criação
- Atualização automática a cada 10 segundos

### Dashboard da Sessão

#### Header da Sessão
- Status da sessão (created, active, paused, closed)
- Veredito final (aprovado/rejeitado)
- Hipótese e descrição
- Datas de criação e encerramento

#### Timeline
- Visualização cronológica de eventos
- Ícones diferentes para cada tipo de evento
- Tempo relativo (ex: "5 min atrás")

#### Painel de Agentes
- Lista de agentes na sessão
- Perfil (debt/tech/market) com ícones
- Budget atual e peso
- Status (ativo/inativo)

#### Painel de Votos
- Contagem de votos por veredito
- Distribuição visual (barras de progresso)
- Lista de votos com rationale

#### Painel de Mensagens
- Lista de mensagens entre agentes
- Ícones do perfil de remetente e destinatário
- Status de leitura

#### Relatório
- Estatísticas (documentos, agentes, opiniões, votos)
- Distribuição de votos
- Download em formato JSON

### Conexão em Tempo Real

- WebSocket para atualizações instantâneas
- Reconexão automática em caso de desconexão
- Contagem de visualizadores conectados
- Status de conexão visual

## Deploy

### Docker

```bash
# Build da imagem
docker build -f apps/thesis-war-room/Dockerfile -t thesis-war-room .

# Executar container
docker run -p 4500:4500 -e NEXT_PUBLIC_API_URL=http://api:4000 thesis-war-room
```

### Docker Compose

O serviço `war-room` está configurado no `docker-compose.yml` raiz do projeto.

## Acessibilidade

- Suporte a leitores de tela
- Navegação por teclado
- Contraste adequado
- Títulos descritivos

## Responsividade

- Mobile-first
- Layout adaptativo para tablets e desktops
- Grid flexível para componentes

## Performance

- Next.js 15 com otimização automática
- Carregamento lazy de componentes
- Streaming de dados via WebSocket
- Cache de assets
