import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { WorkerMessage, AgentTask, AgentResult } from './types.js';
import { log } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class ThreadManager {
  private workers: Map<string, Worker> = new Map();
  private activeCount = 0;
  private maxConcurrent: number;
  private pendingPromises: Map<string, { resolve: (value: AgentResult) => void; reject: (reason?: any) => void }> = new Map();

  constructor(maxConcurrent: number) {
    this.maxConcurrent = maxConcurrent;
    log.debug(`[ThreadManager] Created with max concurrency: ${maxConcurrent}`);
  }

  async runAgentTask(task: AgentTask): Promise<AgentResult> {
    const agentId = task.agent_id;

    log.debug(`[ThreadManager] Running task for agent: ${agentId}, iteration: ${task.iteration}`);

    // If agent already has worker, reuse it
    if (this.workers.has(agentId)) {
      return this.queueTaskForExistingWorker(task);
    }

    // If max concurrency reached, wait
    while (this.activeCount >= this.maxConcurrent) {
      log.debug(`[ThreadManager] Max concurrency (${this.maxConcurrent}) reached, waiting...`);
      await this.sleep(100);
    }

    // Create new worker
    return this.createWorker(task);
  }

  private createWorker(task: AgentTask): Promise<AgentResult> {
    const agentId = task.agent_id;

    return new Promise((resolve, reject) => {
      log.debug(`[ThreadManager] Creating worker for agent: ${agentId}`);

      const worker = new Worker(join(__dirname, 'agent-worker.js'), {
        workerData: task,
      });

      this.workers.set(agentId, worker);
      this.activeCount++;
      this.pendingPromises.set(agentId, { resolve, reject });

      // Timeout handler
      const timeout = setTimeout(() => {
        log.warn(`[ThreadManager] Agent ${agentId} timeout (${task.iteration_timeout_ms}ms)`);
        worker.terminate();
        reject(new Error(`Agent ${agentId} timeout`));
      }, task.iteration_timeout_ms);

      worker.on('message', (msg: WorkerMessage) => {
        if (msg.agent_id !== agentId) {
          return; // Not for this agent
        }

        if (msg.type === 'result') {
          clearTimeout(timeout);
          log.debug(`[ThreadManager] Agent ${agentId} completed successfully`);
          resolve(msg.data as AgentResult);
        } else if (msg.type === 'error') {
          clearTimeout(timeout);
          log.error(`[ThreadManager] Agent ${agentId} error:`, msg.data);
          reject(new Error(msg.data as string));
        }
      });

      worker.on('error', (err) => {
        clearTimeout(timeout);
        log.error(`[ThreadManager] Agent ${agentId} worker error:`, err);
        reject(err);
      });

      worker.on('exit', (code) => {
        clearTimeout(timeout);
        this.workers.delete(agentId);
        this.activeCount--;

        if (code !== 0 && code !== null) {
          log.warn(`[ThreadManager] Worker ${agentId} exited with code ${code}`);
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
      log.debug(`[ThreadManager] Queueing task for existing worker: ${agentId}`);

      // Override previous promise
      const pending = this.pendingPromises.get(agentId);
      if (pending) {
        pending.reject(new Error('Task cancelled by new task'));
      }

      this.pendingPromises.set(agentId, { resolve, reject });

      // Send new task to worker
      worker.postMessage({
        type: 'task',
        agent_id: agentId,
        data: task,
      } as WorkerMessage);

      // Note: Worker doesn't support multiple messages yet
      // For now, return mock result
      resolve({
        agent_id: agentId,
        iteration: task.iteration,
        action: 'wait',
        wait_seconds: 0,
        reasoning: 'Task queue not implemented yet',
      });
    });
  }

  stopAll(): void {
    log.info(`[ThreadManager] Stopping all workers (${this.workers.size} active)...`);

    for (const [agentId, worker] of this.workers) {
      log.debug(`[ThreadManager] Stopping worker: ${agentId}`);
      
      try {
        worker.postMessage({
          type: 'stop',
          agent_id: agentId,
        } as WorkerMessage);
      } catch (err) {
        log.error(`[ThreadManager] Error sending stop to worker ${agentId}:`, err);
      }

      worker.terminate();
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
