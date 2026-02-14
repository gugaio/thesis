import { parentPort, workerData } from 'worker_threads';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { WorkerMessage, AgentTask, AgentResult } from './types.js';
import { log } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class AgentWorker {
  private taskId: string;
  private sessionId: string;
  private profileRole: string;
  private skillContent: string;
  private iteration: number;
  private maxIterations: number;
  private abortController: AbortController | null = null;

  constructor(task: AgentTask) {
    this.taskId = task.agent_id;
    this.sessionId = task.session_id;
    this.profileRole = task.profile_role;
    this.skillContent = task.skill_content;
    this.iteration = task.iteration;
    this.maxIterations = task.max_iterations;

    log.debug(`[Worker ${this.taskId}] Created for profile: ${this.profileRole}`);
  }

  async runIteration(): Promise<AgentResult> {
    if (this.iteration > this.maxIterations) {
      log.debug(`[Worker ${this.taskId}] Max iterations reached (${this.maxIterations})`);
      
      return {
        agent_id: this.taskId,
        iteration: this.iteration,
        action: 'wait',
        wait_seconds: 0,
        reasoning: 'Max iterations reached',
      };
    }

    log.debug(`[Worker ${this.taskId}] Running iteration ${this.iteration}/${this.maxIterations}`);

    // TODO: Integrate with mono-pi
    // For now, return a mock result
    
    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

    // Mock decision based on iteration
    if (this.iteration < 3) {
      return {
        agent_id: this.taskId,
        iteration: this.iteration,
        action: 'opinion',
        content: `[Mock] Opinion from ${this.profileRole} agent at iteration ${this.iteration}`,
        confidence: 0.7 + (Math.random() * 0.2),
        reasoning: 'Mock opinion - mono-pi integration pending',
      };
    } else if (this.iteration < 5) {
      return {
        agent_id: this.taskId,
        iteration: this.iteration,
        action: 'message',
        content: `[Mock] Question from ${this.profileRole} agent to another agent`,
        target_agent: this.getOtherAgent(),
        reasoning: 'Mock message - mono-pi integration pending',
      };
    } else {
      return {
        agent_id: this.taskId,
        iteration: this.iteration,
        action: 'vote',
        verdict: ['approve', 'reject', 'abstain'][Math.floor(Math.random() * 3)] as 'approve' | 'reject' | 'abstain',
        reasoning: 'Mock vote - mono-pi integration pending',
      };
    }
  }

  private getOtherAgent(): string {
    const agents: string[] = ['debt', 'tech', 'market'];
    const otherAgents = agents.filter(a => a !== this.profileRole);
    return otherAgents[Math.floor(Math.random() * otherAgents.length)];
  }

  async stop(): Promise<void> {
    log.debug(`[Worker ${this.taskId}] Stopping...`);
    // Cleanup if needed
  }
}

// Entry point for worker thread
async function runWorker() {
  if (!workerData) {
    throw new Error('No worker data provided');
  }

  const task = workerData as AgentTask;
  const worker = new AgentWorker(task);

  parentPort?.on('message', async (msg: WorkerMessage) => {
    if (msg.type === 'stop') {
      log.debug(`[Worker ${task.agent_id}] Received stop signal`);
      await worker.stop();
      parentPort?.postMessage({ type: 'result', agent_id: task.agent_id });
      process.exit(0);
    }
  });

  try {
    // Run one iteration
    const result = await worker.runIteration();
    parentPort?.postMessage({
      type: 'result',
      agent_id: task.agent_id,
      data: result,
    });
  } catch (error) {
    log.error(`[Worker ${task.agent_id}] Error:`, error);
    parentPort?.postMessage({
      type: 'error',
      agent_id: task.agent_id,
      data: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

// Start worker
runWorker().catch(err => {
  log.error(`[Worker ${workerData?.agent_id || 'unknown'}] Fatal error:`, err);
  parentPort?.postMessage({
    type: 'error',
    agent_id: workerData?.agent_id || 'unknown',
    data: err.message,
  });
  process.exit(1);
});
