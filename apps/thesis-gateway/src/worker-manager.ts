import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { AgentRole } from '@thesis/skills';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface WorkerMessage {
  type: 'task' | 'result' | 'error' | 'stop';
  agent_id: string;
  data?: unknown;
}

interface AgentTask {
  session_id: string;
  agent_id: string;
  profile_role: AgentRole;
  skill_path: string;
  skill_content: string;
  iteration: number;
  max_iterations: number;
  api_url: string;
  ws_url: string;
  pi_provider: string;
  pi_model: string;
  iteration_timeout_ms: number;
  forced_vote?: boolean;
  human_instructions?: string[];
}

interface AgentResult {
  agent_id: string;
  iteration: number;
  action: 'opinion' | 'message' | 'vote' | 'wait' | 'search';
  content?: string;
  confidence?: number;
  target_agent?: AgentRole;
  verdict?: 'approve' | 'reject' | 'abstain';
  wait_seconds?: number;
  reasoning?: string;
}

export class AgentWorkerManager {
  private workers: Map<string, Worker> = new Map();
  private activeCount = 0;
  private maxConcurrent: number;
  private pendingPromises: Map<string, { resolve: (value: AgentResult) => void; reject: (reason?: unknown) => void; timeout: NodeJS.Timeout }> = new Map();

  constructor(maxConcurrent: number) {
    this.maxConcurrent = maxConcurrent;
    console.log(`[AgentWorkerManager] Created with max concurrency: ${maxConcurrent}`);
  }

  async runAgentTask(task: AgentTask): Promise<AgentResult> {
    const agentId = task.agent_id;

    console.log(`[AgentWorkerManager] Running task for agent: ${agentId}, iteration: ${task.iteration}`);

    if (this.workers.has(agentId)) {
      return this.queueTaskForExistingWorker(task);
    }

    while (this.activeCount >= this.maxConcurrent) {
      console.log(`[AgentWorkerManager] Max concurrency (${this.maxConcurrent}) reached, waiting...`);
      await this.sleep(100);
    }

    return this.createWorker(task);
  }

  private createWorker(task: AgentTask): Promise<AgentResult> {
    const agentId = task.agent_id;

    return new Promise((resolve, reject) => {
      console.log(`[AgentWorkerManager] Creating worker for agent: ${agentId}`);

      const workerPath = join(__dirname, '../../../apps/thesis-agent-runtime/dist/agent-worker.js');
      const worker = new Worker(workerPath, {
        workerData: task,
      });

      this.workers.set(agentId, worker);
      this.activeCount++;

      const timeout = setTimeout(() => {
        console.warn(`[AgentWorkerManager] Agent ${agentId} timeout (${task.iteration_timeout_ms}ms)`);
        worker.terminate();
        const pending = this.pendingPromises.get(agentId);
        if (pending) {
          pending.reject(new Error(`Agent ${agentId} timeout`));
          this.pendingPromises.delete(agentId);
          this.activeCount--;
        }
      }, task.iteration_timeout_ms);

      this.pendingPromises.set(agentId, { resolve, reject, timeout });

      worker.on('message', (msg: WorkerMessage) => {
        if (msg.agent_id !== agentId) {
          return;
        }

        const pending = this.pendingPromises.get(agentId);
        if (!pending) {
          console.warn(`[AgentWorkerManager] No pending promise for agent ${agentId}`);
          return;
        }

        if (msg.type === 'result') {
          clearTimeout(pending.timeout);
          console.log(`[AgentWorkerManager] Agent ${agentId} completed successfully`);
          pending.resolve(msg.data as AgentResult);
          this.pendingPromises.delete(agentId);
          this.activeCount--;
        } else if (msg.type === 'error') {
          clearTimeout(pending.timeout);
          console.error(`[AgentWorkerManager] Agent ${agentId} error:`, msg.data);
          pending.reject(new Error(msg.data as string));
          this.pendingPromises.delete(agentId);
          this.activeCount--;
        }
      });

      worker.on('error', (err) => {
        const pending = this.pendingPromises.get(agentId);
        if (pending) {
          clearTimeout(pending.timeout);
          console.error(`[AgentWorkerManager] Agent ${agentId} worker error:`, err);
          pending.reject(err);
          this.pendingPromises.delete(agentId);
          this.activeCount--;
        }
      });
    });
  }

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
        clearTimeout(pending.timeout);
        pending.reject(new Error('Task cancelled by new task'));
      } else {
        this.activeCount++;
      }

      const timeout = setTimeout(() => {
        console.warn(`[AgentWorkerManager] Agent ${agentId} timeout (${task.iteration_timeout_ms}ms)`);
        const currentPending = this.pendingPromises.get(agentId);
        if (currentPending) {
          currentPending.reject(new Error(`Agent ${agentId} timeout`));
          this.pendingPromises.delete(agentId);
          this.activeCount--;
        }
      }, task.iteration_timeout_ms);

      this.pendingPromises.set(agentId, { resolve, reject, timeout });

      worker.postMessage({
        type: 'task',
        agent_id: agentId,
        data: task,
      } as WorkerMessage);
    });
  }

  stopAll(): void {
    console.log(`[AgentWorkerManager] Stopping all workers (${this.workers.size} active)...`);

    for (const [agentId, worker] of this.workers) {
      console.log(`[AgentWorkerManager] Stopping worker: ${agentId}`);

      try {
        worker.postMessage({
          type: 'stop',
          agent_id: agentId,
        } as WorkerMessage);
      } catch (err) {
        console.error(`[AgentWorkerManager] Error sending stop to worker ${agentId}:`, err);
      }
    }

    this.workers.clear();
    this.activeCount = 0;
    this.pendingPromises.clear();
  }

  getStats() {
    return {
      activeWorkers: this.activeCount,
      maxConcurrency: this.maxConcurrent,
      workerCount: this.workers.size,
      pendingTasks: this.pendingPromises.size,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
