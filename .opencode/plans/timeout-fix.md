# Correção: Limpar Timeout Anterior ao Enfileirar Nova Task

## 🐛 Problema

Quando uma nova task é enfileirada para um worker existente, o timeout antigo **não é limpo**. Isso causa o timeout antigo a expirar e rejeitar a task NOVA que já está em andamento.

## 💡 Solução

Adicionar mapa de timeout IDs e limpar o timeout anterior ao enfileirar nova task:

```typescript
private timeoutIds: Map<string, NodeJS.Timeout> = new Map();

private queueTaskForExistingWorker(task: AgentTask): Promise<AgentResult> {
  const agentId = task.agent_id;
  const worker = this.workers.get(agentId);

  if (!worker) {
    throw new Error(`Worker for agent ${agentId} not found`);
  }

  return new Promise((resolve, reject) => {
    console.log(`[AgentWorkerManager] Queueing task for existing worker: ${agentId}`);

    const pending = this.pendingPromises.get(agentId);
    if (pending) {
      pending.reject(new Error('Task cancelled by new task'));
    }

    this.pendingPromises.set(agentId, { resolve, reject });

    // 🔑 LIMPAR TIMEOUT ANTERIOR
    const oldTimeout = this.timeoutIds.get(agentId);
    if (oldTimeout) {
      clearTimeout(oldTimeout);
      console.log(`[AgentWorkerManager] Cleared old timeout for agent ${agentId}`);
    }

    const timeout = setTimeout(() => {
      console.warn(`[AgentWorkerManager] Agent ${agentId} task timeout after 60s`);
      reject(new Error(`Agent ${agentId} task timeout`));
      this.timeoutIds.delete(agentId);
    }, 60000);

    this.timeoutIds.set(agentId, timeout);

    worker.postMessage({
      type: 'task',
      agent_id: agentId,
      data: task,
    } as WorkerMessage);
  });
}
```

## 📝 Onde Aplicar

**Arquivo:** `apps/thesis-gateway/src/worker-manager.ts`
**Classe:** `AgentWorkerManager`
**Propriedade privada a adicionar:** `private timeoutIds: Map<string, NodeJS.Timeout> = new Map();`
**Método a modificar:** `queueTaskForExistingWorker` (aproxim linha 124)

Quer que eu aplique essa correção?
