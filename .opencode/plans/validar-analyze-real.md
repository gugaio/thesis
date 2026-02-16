# 📋 Plano: Validar Fluxo thesis analyze com LLM Real

## 🎯 Objetivo

Validar que o fluxo principal do `thesis analyze` com uso real de LLMs e agentes está 100% implementado e pronto para testes.

## ✅ Análise Completa

### Status: 100% Implementado ✅

O fluxo principal do `thesis analyze` com uso real de LLMs e agentes está **completamente implementado** e pronto para testes.

## 🏗️ O que está Implementado

### 1. CLI - Comando `analyze` ✅
- **Arquivo:** `apps/thesis-cli/src/index.ts` (linhas 569-651)
- **Funcionalidades:**
  - Validação de input (session, iterations, timeout)
  - Verificação se sessão existe e está ativa
  - Spawn do processo gateway com variáveis de ambiente
  - Passa `PI_PROVIDER`, `PI_MODEL`, `PI_API_KEY` para o gateway
  - Logs em tempo real via `stdio: inherit`
  - Exibe resumo após conclusão

**Uso:**
```bash
node apps/thesis-cli/dist/index.js analyze --session <id> --iterations 10 --timeout 60000
```

### 2. Gateway - Orquestrador ✅
- **Arquivo:** `apps/thesis-gateway/src/index.ts`
- **Funcionalidades:**
  - Busca sessão da API
  - Conecta WebSocket
  - Registra 3 agentes automaticamente (debt, tech, market)
  - Executa loop de iterações com workers paralelos
  - Processa resultados (opinions, messages, votes)
  - Fecha sessão com veredito baseado em maioria
  - Tratamento de erros e SIGTERM/SIGINT

**Arquitetura:**
```
CLI → Gateway → AgentWorkerManager → 3 Agent Workers (debt, tech, market)
                    ↓
                  API + WebSocket
```

### 3. Agent Worker - Integração LLM Real ✅
- **Arquivo:** `apps/thesis-agent-runtime/src/agent-worker.ts`
- **Funcionalidades:**
  - Inicialização com mono-pi Agent (linha 258-292)
  - Busca contexto real via APIClient (linha 70-141)
  - Decisões autônomas baseadas em LLM (linha 349-383)
  - Chamada à LLM com timeout (linha 294-338)
  - Parse de decisões estruturadas JSON (linha 229-256)
  - Dedução de budget por ação (linha 430-433)
  - Tratamento de erros com fallback para `wait`

**Componentes mono-pi:**
```typescript
const model = getModel(this.piProvider, this.piModel);
this.piAgent = new Agent({
  initialState: { systemPrompt, model, ... },
  getApiKey: (provider: string) => config.pi_api_key,
});
```

### 4. Contexto Real ✅
- **Arquivo:** `apps/thesis-agent-runtime/src/api-client.ts`
- **Dados buscados da API:**
  - Sessão (hipótese, status, veredito)
  - Documentos (lista com metadata)
  - Agentes (com profiles)
  - Opiniões anteriores
  - Mensagens anteriores
  - Votos anteriores

**Contexto completo:**
```typescript
interface AutonomousAgentContext {
  session_id, agent_id, profile;
  iteration, max_iterations;
  budget, hypothesis, hypothesis_description;
  documents, other_agents;
  previous_opinions, previous_messages, previous_votes;
  session_status, final_verdict;
}
```

### 5. Worker Threads - Paralelismo ✅
- **Arquivo:** `apps/thesis-gateway/src/worker-manager.ts`
- **Funcionalidades:**
  - Gerencia até 3 workers paralelos
  - Respeita max concurrency
  - Timeout por worker (configurável)
  - Reusa workers existentes
  - Stats ativos (activeWorkers, workerCount)

### 6. Skills e Prompts ✅
- **SOUL:** `packages/skills/SOUL.md` - Diretrizes globais
- **BASE_SYSTEM:** `packages/skills/BASE_SYSTEM.md` - Sistema prompt base
- **Skills:**
  - `debt-specialist/SKILL.md` - Especialista em finanças
  - `tech-expert/SKILL.md` - Especialista em tecnologia
  - `market-analyst/SKILL.md` - Especialista em mercado

**Composição de prompts:**
```typescript
const systemPrompt = composePrompt(
  baseSystem,    // BASE_SYSTEM.md
  soul,          // SOUL.md
  profileDesc,   // Profile description
  skillContent,  // SKILL.md
  constraints    // Budget, session rules
);
```

### 7. Docker Services ✅
- **Arquivo:** `docker-compose.yml`
- **Serviços:**
  - `postgres` - Banco de dados
  - `api` - REST API + WebSocket
  - `gateway` - Gateway worker (serviço base)
  - `orchestrator` - Orquestrador com env vars
  - `cli` - CLI interface
  - `war-room` - Dashboard Next.js

**Status:** ✅ API respondendo, logs mostram atividade

### 8. Build ✅
Todos os serviços compilados:
- ✅ `apps/thesis-cli/dist/index.js` (23KB)
- ✅ `apps/thesis-gateway/dist/index.js` (12KB)
- ✅ `apps/thesis-agent-runtime/dist/agent-worker.js` (17KB)
- ✅ `packages/prompt-adapter/dist/` (arquivos .d.ts gerados)

### 9. Environment Variables ✅
- **Arquivo:** `.env`
- **Variáveis configuradas:**
  - `PI_PROVIDER=openai`
  - `PI_MODEL=gpt-4o-mini`
  - `PI_API_KEY=sk-your-api-key-here` (precisa ser atualizada)
  - `API_URL=http://localhost:4000`
  - `MAX_ITERATIONS=10`
  - `ITERATION_TIMEOUT=60000`

### 10. Script de Validação ✅
- **Arquivo:** `scripts/validate-analyze-flow.ts`
- **Funcionalidades:**
  - Cria sessão de teste
  - Upload de documento (opcional)
  - Executa analyze com LLM real
  - Valida resultados (agents, opinions, messages, votes)
  - Gera relatório final em JSON
  - Exibe análise detalhada do comportamento dos agentes

**Uso:**
```bash
node scripts/validate-analyze-flow.ts [options]
```

## 🧪 Como Fazer Teste Real

### Pré-requisitos

1. **API Key OpenAI:**
   - Editar `.env`:
   ```bash
   PI_API_KEY=sk-your-real-openai-api-key-here
   ```

2. **Docker rodando:**
   ```bash
   docker-compose up -d
   docker-compose ps  # Verificar se api está healthy
   ```

3. **API verificando:**
   ```bash
   curl http://localhost:4000/health
   # Deve retornar: {"status":"healthy",...}
   ```

### Teste Manual (Passo a Passo)

```bash
# 1. Criar sessão
node apps/thesis-cli/dist/index.js init-session \
  --hypothesis "AI-powered SaaS startup with strong market fit" \
  --description "Test for real LLM integration"

# 2. (Opcional) Upload de documento
node apps/thesis-cli/dist/index.js upload-doc \
  --session <SESSION_ID> \
  --file ./test-doc.txt

# 3. Executar analyze (com LLM real!)
node apps/thesis-cli/dist/index.js analyze \
  --session <SESSION_ID> \
  --iterations 5 \
  --timeout 60000

# 4. Verificar resultados
node apps/thesis-cli/dist/index.js status --session <SESSION_ID>

# 5. Gerar relatório
node apps/thesis-cli/dist/index.js generate-report \
  --session <SESSION_ID> \
  --output report.json
```

### Teste Automatizado (Script de Validação)

```bash
# Teste básico
node scripts/validate-analyze-flow.ts

# Teste com parâmetros customizados
node scripts/validate-analyze-flow.ts \
  --hypothesis "Custom test hypothesis" \
  --iterations 3 \
  --timeout 60000 \
  --document ./test-doc.txt \
  --report ./custom-report.json
```

## 📊 O que vai acontecer durante o teste

1. **CLI** spawna processo do **Gateway** com env vars
2. **Gateway** busca sessão e conecta **WebSocket**
3. **Gateway** registra 3 agentes (debt, tech, market) na API
4. **Gateway** cria 3 **Agent Workers** via worker_threads
5. **Cada Agent Worker:**
   - Inicializa mono-pi Agent com OpenAI
   - Busca contexto real da API (session, docs, agents, opinions, messages, votes)
   - Compõe prompt (BASE_SYSTEM + SOUL + Profile + SKILL + Constraints + Context)
   - Chama LLM (OpenAI gpt-4o-mini)
   - Recebe decisão estruturada JSON (action: opinion/message/vote/wait)
   - Retorna resultado para Gateway
6. **Gateway** registra ações na API (POST /opinions, /messages, /votes)
7. **Gateway** aguarda ITERATION_DELAY entre iterações
8. **Gateway** para quando: todos votaram OU max iterações
9. **Gateway** fecha sessão com veredito (maioria de votos)
10. **CLI** exibe resumo final

## 🎯 O que esperar da LLM

**Exemplo de decisão estruturada:**
```json
{
  "action": "opinion",
  "reasoning": "Based on the uploaded documents, the startup has strong unit economics with LTV:CAC ratio of 5:1, but burn rate is concerning at $500k/month",
  "content": "The financial metrics show promising unit economics (LTV:CAC 5:1, payback 18 months) indicating healthy customer economics. However, the current burn rate of $500k/month gives only 8 months runway with current funding, which is risky for Series A stage. I recommend improving capital efficiency or raising bridge funding before approaching investors.",
  "confidence": 0.7
}
```

**Possíveis ações:**
- `opinion` - Quando tem insights baseados em documentos/confiança moderada-alta
- `message` - Quando precisa de info de outro agente ou quer questionar opinião
- `vote` - Quando tem evidência suficiente e considerou todas perspectivas
- `wait` - Quando budget baixo, precisa de mais info, ou incerto

## 🐛 Problemas Conhecidos

**Nenhum problema conhecido que impeça o funcionamento.**

- ✅ CommonJS vs ES Modules: RESOLVIDO (Fase 10)
- ✅ Skills Parser: CORRIGIDO (parsing YAML baseado em stack)
- ✅ Agent Worker imports: FUNCIONAL (consegue importar `@thesis/prompt-adapter` e `@thesis/tools`)
- ✅ Mono-pi integração: COMPLETA (usa Agent real e getModel)
- ✅ Contexto real: IMPLEMENTADO (busca todos os dados da API)
- ✅ Decisões autônomas: IMPLEMENTADAS (LLM decide ações autonomamente)

## 📌 Próximos Passos

### Opção 1: Teste Real Imediato
1. Editar `.env` e colocar API Key real
2. Rodar `docker-compose up -d`
3. Executar `node scripts/validate-analyze-flow.ts --iterations 3`

### Opção 2: Ir para Hardening (Fase 12)
- Implementar retries
- Implementar rate limiting
- Implementar observabilidade (metrics, logs estruturados)
- Implementar health checks avançados

### Opção 3: Adicionar Mais Features
- Integrações externas (Slack, WhatsApp) - adiar para depois
- Analytics e dashboards avançados
- Export de relatórios em PDF/Excel
- Versionamento de sessões

---

**Status:** ✅ 100% Implementado, pronto para teste real
**Faltando:** Apenas API Key OpenAI real
**Próximo:** Teste real ou Hardening (Fase 12)
