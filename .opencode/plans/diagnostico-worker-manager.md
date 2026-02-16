# Diagnóstico: Bug no Worker Manager após iteração 1

## 🐛 Problema Identificado

**Observação nos logs:**
- **Iteração 1:** 3 agentes executam com sucesso, enviam mensagens, completam
- **Iteração 2:** "Queueing task for existing worker" para todos os agentes
- **Depois:** NADA. Workers não respondem, promessas nunca resolvem

## 🔍 Análise do Fluxo

### Iteração 1
1. `runAgentTask()` cria 3 workers via `createWorker()`
2. Workers executam tasks
3. Workers chamam `process.exit(0)` ao completar (linha 469 do agent-worker.ts)
4. Evento `worker.on('exit')` dispara no worker-manager (linha 112-120):
   ```typescript
   worker.on('exit', (code) => {
     clearTimeout(timeout);
     this.workers.delete(agentId);  // ❌ Worker removido do mapa
     this.activeCount--;
     // ...
   });
   ```

### Iteração 2
1. `runAgentTask()` verifica `this.workers.has(agentId)` → FALSE (worker foi deletado)
2. Cria **NOVO** worker via `createWorker()` (OK)
3. Mas... espera, isso não explica o bug

## 🎯 O Real Problema

**Acontece quando a task ainda está pendente quando worker sai:**

### Cenário Bug:
1. Worker criado na iteração 1
2. Worker completa tarefa e chama `process.exit(0)`
3. `worker.on('exit')` remove worker de `this.workers`
4. Mas... se houver task na fila (`queueTaskForExistingWorker`), a promessa ainda está em `this.pendingPromises`
5. Quando `this.pendingPromises.clear()` for chamado (linha 178), a promessa é destruída sem nunca resolver!

### Cenário Alternativo (Mais Provável):

**Agent worker sai após completar a iteração 1:**

1. `createWorker()` cria worker
2. Worker completa, envia resultado
3. Worker chama `process.exit(0)` (linha 469 do agent-worker.ts)
4. `worker.on('exit')` dispara, remove worker de `this.workers`
5. Iteração 2 começa
6. `this.workers.has(agentId)` → FALSE
7. Cria **NOVO** worker
8. Mas não há handler para mensagem do **NOVO** worker!
9. Ou... o worker.on('exit') ainda está ativo do worker antigo

## 🛠️ Soluções

### Opção 1: Manter Workers Rodando (Recomendado)
Não deixar workers saírem após cada iteração. Reusar o mesmo worker para todas as iterações.

**agent-worker.ts:**
- Remover `process.exit(0)` após completar iteração
- Implementar handler para mensagens de tipo 'task' para reusar worker

**worker-manager.ts:**
- Remover `worker.on('exit')` (não precisa se worker não sai)
- Implementar `stopAll()` que envia mensagem 'stop' para cada worker

### Opção 2: Gerenciar Promessas Corretamente
Se workers devem sair, gerenciar as promessas pendentes.

**worker-manager.ts:**
- Adicionar `exitedWorkers: Set<string>` para rastrear workers que saíram
- Quando worker sair, rejeitar promessas pendentes explicitamente
- Em `queueTaskForExistingWorker`, verificar se worker saiu e criar novo

### Opção 3: Simplificar (Remover Reuso)
Criar novo worker a cada iteração, sem tentar reusar.

**worker-manager.ts:**
- Remover verificação `if (this.workers.has(agentId))`
- Sempre criar novo worker
- Remover `queueTaskForExistingWorker()`

## 💡 Recomendação

**Opção 1** é a melhor porque:
- Mais eficiente (sem criar/destruir workers)
- Mais simples (menos estado complexo)
- Evita race conditions
- Workers são threads reutilizáveis por design

## 📝 Próximos Passos

Se usuário aprovar:
1. Implementar Opção 1 (Manter Workers Rodando)
2. Testar com iterações múltiplas
3. Garantir que `stopAll()` funciona corretamente
