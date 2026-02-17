import { WebSocket } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { AGENTS_CONFIG, type AgentRole } from '@thesis/skills';
import { AgentWorkerManager } from './worker-manager.js';
import { ApiGatewayClient } from './api-gateway-client.js';
import { logError, logInfo, logWarn } from './logger.js';
import { transitionAfterIteration } from './runner-state.js';
import { parseGatewayCommandEventMessage } from './websocket-event-parser.js';
import { dispatchGatewayCommand } from './command-dispatcher.js';
import type { GatewayCommandEvent, GatewayRunnerConfig, RunnerState, SessionVote } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class SessionRunner {
  private ws: WebSocket | null = null;
  private running = false;
  private workerManager: AgentWorkerManager;
  private apiClient: ApiGatewayClient;
  private agentIds: Map<AgentRole, string> = new Map();
  private votes: Set<string> = new Set();
  private currentIteration = 0;
  private state: RunnerState = 'stopped';
  private wakeResolver: (() => void) | null = null;
  private pendingInstructions: Map<AgentRole, string[]> = new Map();
  private forcedVoteRound = false;

  constructor(
    private readonly sessionId: string,
    private readonly config: GatewayRunnerConfig
  ) {
    this.workerManager = new AgentWorkerManager(AGENTS_CONFIG.length);
    this.apiClient = new ApiGatewayClient(config.apiUrl);
  }

  async start(): Promise<void> {
    logInfo({ sessionId: this.sessionId }, 'Runner starting');
    this.running = true;
    this.state = 'running';

    const sessionData = await this.apiClient.fetchSession(this.sessionId);
    if (!sessionData) {
      throw new Error(`Session ${this.sessionId} not found`);
    }

    logInfo({ sessionId: this.sessionId }, `Hypothesis: ${sessionData.hypothesis.statement}`);

    await this.connectWebSocket();
    await this.registerAgents();
    await this.runLoop();
  }

  stop(): void {
    logInfo({ sessionId: this.sessionId }, 'Stopping runner');
    this.running = false;
    this.state = 'stopped';
    this.wakeLoop();
    this.workerManager.stopAll();
    this.ws?.close();
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${this.config.wsUrl}/ws/sessions/${this.sessionId}`);

      this.ws.on('open', () => {
        logInfo({ sessionId: this.sessionId }, 'WebSocket connected');
        resolve();
      });

      this.ws.on('error', (error: Error) => {
        logError({ sessionId: this.sessionId }, 'WebSocket error', error);
        reject(error);
      });

      this.ws.on('message', (data: Buffer) => {
        const event = parseGatewayCommandEventMessage(data);
        if (!event || event.sessionId !== this.sessionId) {
          return;
        }
        this.handleGatewayCommand(event);
      });
    });
  }

  private async registerAgents(): Promise<void> {
    for (const profile of AGENTS_CONFIG) {
      try {
        const role = profile.role as AgentRole;
        const agentId = await this.apiClient.registerAgent(this.sessionId, role);
        this.agentIds.set(role, agentId);
        logInfo({ sessionId: this.sessionId }, `Registered ${role} agent (${agentId})`);
      } catch (error) {
        logError({ sessionId: this.sessionId }, `Failed registering ${profile.role} agent`, error);
        throw error;
      }
    }
  }

  private async runLoop(): Promise<void> {
    while (this.running) {
      if (this.state === 'idle') {
        await this.waitForCommand();
        continue;
      }

      if (this.config.maxIterations > 0 && this.currentIteration >= this.config.maxIterations) {
        logWarn({ sessionId: this.sessionId }, `Iteration limit reached (${this.config.maxIterations}); entering idle`);
        this.state = 'idle';
        continue;
      }

      this.currentIteration += 1;
      logInfo({ sessionId: this.sessionId, iteration: this.currentIteration }, 'Starting iteration');

      const tasks = this.createAgentTasks();
      const results = await Promise.all(tasks.map(task => this.workerManager.runAgentTask(task)));
      const allWaiting = await this.processResults(results);

      const iterationTransition = transitionAfterIteration({
        allWaiting,
        forcedVoteRound: this.forcedVoteRound,
        allVoted: this.votes.size === AGENTS_CONFIG.length,
      });

      this.state = iterationTransition.state;
      this.forcedVoteRound = iterationTransition.forcedVoteRound;

      if (this.state === 'stopped') {
        logInfo({ sessionId: this.sessionId }, 'Voting round completed; closing session');
        await this.closeSession();
        this.running = false;
        break;
      }

      if (this.state === 'idle') {
        logInfo({ sessionId: this.sessionId }, 'All agents waiting; runner is idle');
      }

      if (this.running && this.state === 'running') {
        await this.sleep(this.config.iterationDelay);
      }
    }
  }

  private createAgentTasks() {
    return AGENTS_CONFIG.map(profile => {
      const role = profile.role as AgentRole;
      const instructions = this.pendingInstructions.get(role) ?? [];
      return {
        session_id: this.sessionId,
        agent_id: this.agentIds.get(role)!,
        profile_role: role,
        skill_path: join(__dirname, '../../../packages/skills', profile.skillFile),
        skill_content: '',
        iteration: this.currentIteration,
        max_iterations: this.config.maxIterations,
        api_url: this.config.apiUrl,
        ws_url: this.config.wsUrl,
        pi_provider: this.config.piProvider,
        pi_model: this.config.piModel,
        iteration_timeout_ms: this.config.iterationTimeout,
        forced_vote: this.forcedVoteRound,
        human_instructions: instructions,
      };
    }).map(task => {
      this.pendingInstructions.delete(task.profile_role);
      return task;
    });
  }

  private async processResults(results: any[]): Promise<boolean> {
    let waitCount = 0;

    for (const result of results) {
      if (!result) {
        waitCount += 1;
        continue;
      }

      logInfo(
        { sessionId: this.sessionId, iteration: this.currentIteration, action: result.action },
        `Agent ${result.agent_id}: ${(result.reasoning || '').slice(0, 80)}`
      );

      switch (result.action) {
        case 'opinion':
          await this.postOpinion(result);
          break;
        case 'message':
          await this.postMessage(result);
          break;
        case 'vote':
          await this.castVote(result);
          break;
        case 'wait':
          waitCount += 1;
          break;
        case 'search':
          logWarn({ sessionId: this.sessionId, iteration: this.currentIteration, action: 'search' }, 'Search action ignored in local mode');
          waitCount += 1;
          break;
        default:
          waitCount += 1;
          break;
      }
    }

    return waitCount === results.length;
  }

  private async postOpinion(result: any): Promise<void> {
    const response = await this.apiClient.postOpinion(this.sessionId, {
      agentId: result.agent_id,
      content: result.content,
      confidence: result.confidence,
    });

    if (!response.ok) {
      logWarn({ sessionId: this.sessionId, iteration: this.currentIteration, action: 'opinion' }, `Failed posting opinion: ${response.statusText}`);
    }
  }

  private async postMessage(result: any): Promise<void> {
    const targetAgentId = this.agentIds.get(result.target_agent as AgentRole);
    if (!targetAgentId || !result.content || result.content.trim().length === 0) {
      return;
    }

    const response = await this.apiClient.postMessage(this.sessionId, {
      fromAgentId: result.agent_id,
      toAgentId: targetAgentId,
      content: result.content,
    });

    if (!response.ok) {
      logWarn({ sessionId: this.sessionId, iteration: this.currentIteration, action: 'message' }, `Failed posting message: ${response.statusText}`);
    }
  }

  private async castVote(result: any): Promise<void> {
    const response = await this.apiClient.castVote(this.sessionId, {
      agentId: result.agent_id,
      verdict: result.verdict,
      rationale: result.reasoning || `Analysis iteration ${this.currentIteration}`,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logWarn({ sessionId: this.sessionId, iteration: this.currentIteration, action: 'vote' }, `Failed casting vote: ${response.statusText} - ${errorBody}`);
      return;
    }

    this.votes.add(result.agent_id);
  }

  private async closeSession(): Promise<void> {
    let votes: SessionVote[];
    try {
      votes = await this.apiClient.listVotes(this.sessionId);
    } catch (error) {
      logError({ sessionId: this.sessionId }, 'Failed to fetch votes before close', error);
      return;
    }

    if (votes.length === 0) {
      logWarn({ sessionId: this.sessionId }, 'No votes cast; skipping close');
      return;
    }

    const approveCount = votes.filter(v => v.verdict === 'approve').length;
    const rejectCount = votes.filter(v => v.verdict === 'reject').length;
    const verdict = approveCount > rejectCount ? 'approve' : 'reject';

    const response = await this.apiClient.closeSession(this.sessionId, {
      verdict,
      rationale: `Voting round completed with ${votes.length} votes. approve=${approveCount}, reject=${rejectCount}.`,
    });

    if (!response.ok) {
      logWarn({ sessionId: this.sessionId }, `Failed to close session: ${response.statusText}`);
      return;
    }

    logInfo({ sessionId: this.sessionId }, `Session closed with verdict: ${verdict}`);
  }

  private handleGatewayCommand(event: GatewayCommandEvent): void {
    const dispatch = dispatchGatewayCommand({
      event,
      currentForcedVoteRound: this.forcedVoteRound,
      currentInstructions: this.pendingInstructions,
    });

    this.state = dispatch.nextState;
    this.forcedVoteRound = dispatch.nextForcedVoteRound;
    this.pendingInstructions = dispatch.nextInstructions;

    if (dispatch.shouldWake) {
      this.wakeLoop();
    }
  }

  private waitForCommand(): Promise<void> {
    return new Promise((resolve) => {
      this.wakeResolver = resolve;
    });
  }

  private wakeLoop(): void {
    if (!this.wakeResolver) {
      return;
    }
    const resolver = this.wakeResolver;
    this.wakeResolver = null;
    resolver();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
