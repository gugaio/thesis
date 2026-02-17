import dotenv from 'dotenv';
import { WebSocket } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { AgentWorkerManager } from './worker-manager.js';
import { AGENTS_CONFIG, type AgentRole } from '@thesis/skills';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:4000';
const WS_URL = process.env.WS_URL || 'ws://localhost:4000';
const MAX_ITERATIONS = parseInt(process.env.MAX_ITERATIONS || '10', 10);
const ITERATION_TIMEOUT = parseInt(process.env.ITERATION_TIMEOUT || '60000', 10);
const ITERATION_DELAY = parseInt(process.env.ITERATION_DELAY || '2000', 10);
const PI_PROVIDER = process.env.PI_PROVIDER || 'openai';
const PI_MODEL = process.env.PI_MODEL || 'gpt-4o-mini';

interface SessionData {
  id: string;
  status: string;
  hypothesis: {
    statement: string;
    description?: string;
  };
  finalVerdict?: string;
}

interface AgentInfo {
  agentId: string;
  profile: {
    role: string;
    name: string;
  };
}

interface OrchestratorCommandEvent {
  type: 'orchestrator.command_issued';
  sessionId: string;
  commandType: 'ask' | 'resume' | 'vote';
  issuedBy: string;
  targetAgentRole?: AgentRole;
  content?: string;
}

interface SessionVote {
  agentId: string;
  verdict: 'approve' | 'reject' | 'abstain';
}

interface WebSocketEnvelope {
  type: string;
  data?: {
    type?: string;
    [key: string]: unknown;
  };
}

type OrchestratorState = 'running' | 'idle' | 'stopped';

class GatewayOrchestrator {
  private ws: WebSocket | null = null;
  private sessionData: SessionData | null = null;
  private running = false;
  private workerManager: AgentWorkerManager;
  private agentIds: Map<AgentRole, string> = new Map();
  private votes: Set<string> = new Set();
  private currentIteration = 0;
  private state: OrchestratorState = 'stopped';
  private wakeResolver: (() => void) | null = null;
  private pendingInstructions: Map<AgentRole, string[]> = new Map();
  private forcedVoteRound = false;

  constructor() {
    this.workerManager = new AgentWorkerManager(AGENTS_CONFIG.length);
  }

  async start(sessionId: string): Promise<void> {
    console.log(`🚀 THESIS Gateway starting analysis for session: ${sessionId}`);

    this.sessionData = await this.fetchSession(sessionId);
    if (!this.sessionData) {
      throw new Error(`Session ${sessionId} not found`);
    }

    console.log(`📝 Session hypothesis: ${this.sessionData.hypothesis.statement}`);
    if (this.sessionData.hypothesis.description) {
      console.log(`📝 Description: ${this.sessionData.hypothesis.description}`);
    }

    await this.connectWebSocket();
    await this.registerAgents(sessionId);
    await this.runAnalysisLoop(sessionId);
  }

  async fetchSession(sessionId: string): Promise<SessionData | null> {
    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch session: ${response.statusText}`);
      }
      const data = await response.json() as any;
      return {
        id: data.session.id,
        status: data.session.status,
        hypothesis: data.hypothesis,
        finalVerdict: data.session.finalVerdict,
      };
    } catch (error) {
      console.error('❌ Error fetching session:', error);
      return null;
    }
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`🔌 Connecting to WebSocket: ${WS_URL}`);

      this.ws = new WebSocket(`${WS_URL}/ws/sessions/${this.sessionData!.id}`);

      this.ws.on('open', () => {
        console.log('✅ WebSocket connected');
        resolve();
      });

      this.ws.on('error', (error: Error) => {
        console.error('❌ WebSocket error:', error);
        reject(error);
      });

      this.ws.on('message', (data: Buffer) => {
        const payload = JSON.parse(data.toString()) as WebSocketEnvelope;
        if (payload.type === 'event' && payload.data?.type === 'orchestrator.command_issued') {
          this.handleOrchestratorCommand(payload.data as unknown as OrchestratorCommandEvent);
          return;
        }
        console.log(`📨 WebSocket event: ${payload.type}`);
      });

      this.ws.on('close', () => {
        console.log('👋 WebSocket connection closed');
      });
    });
  }

  private async registerAgents(sessionId: string): Promise<void> {
    console.log('\n🤖 Registering agents...');

    for (const profile of AGENTS_CONFIG) {
      try {
        const response = await fetch(`${API_URL}/sessions/${sessionId}/agents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileRole: profile.role,
            initialCredits: 100
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to register ${profile.role} agent: ${response.statusText}`);
        }

        const result = await response.json() as AgentInfo;
        this.agentIds.set(profile.role as AgentRole, result.agentId);
        console.log(`✅ Registered ${profile.name} (ID: ${result.agentId})`);
      } catch (error) {
        console.error(`❌ Error registering ${profile.role} agent:`, error);
        throw error;
      }
    }
  }

  private async runAnalysisLoop(sessionId: string): Promise<void> {
    console.log('\n🏃 Running analysis loop for session:', sessionId);
    this.running = true;
    this.state = 'running';

    while (this.running) {
      if (this.state === 'idle') {
        await this.waitForCommand();
        continue;
      }

      if (MAX_ITERATIONS > 0 && this.currentIteration >= MAX_ITERATIONS) {
        console.log(`\n⏸️  Iteration limit reached (${MAX_ITERATIONS}). Waiting for human command...`);
        this.state = 'idle';
        continue;
      }

      this.currentIteration += 1;
      console.log(`\n🔄 Iteration ${this.currentIteration}`);

      const tasks = this.createAgentTasks(sessionId, this.currentIteration);
      console.log(`📋 Running ${tasks.length} agents in parallel...`);

      try {
        const results = await Promise.all(tasks.map(task => this.workerManager.runAgentTask(task)));
        const allWaiting = await this.processResults(results, sessionId);

        if (this.forcedVoteRound && this.votes.size === AGENTS_CONFIG.length) {
          console.log('\n🏁 Voting round complete. Closing session...');
          await this.closeSession(sessionId);
          this.running = false;
          this.state = 'stopped';
          break;
        }

        if (allWaiting) {
          console.log('\n⏸️  All agents are waiting. Orchestrator is idle until new command.');
          this.state = 'idle';
          this.forcedVoteRound = false;
        }
      } catch (error) {
        console.error('❌ Error running iteration:', error);
      }

      console.log(`\n📊 Stats:`, this.workerManager.getStats());

      if (this.running && this.state === 'running') {
        await this.sleep(ITERATION_DELAY);
      }
    }
  }

  private createAgentTasks(sessionId: string, iteration: number) {
    return AGENTS_CONFIG.map(profile => {
      const role = profile.role as AgentRole;
      const instructions = this.pendingInstructions.get(role) ?? [];
      return {
        session_id: sessionId,
        agent_id: this.agentIds.get(role)!,
        profile_role: role,
        skill_path: join(__dirname, '../../../packages/skills', profile.skillFile),
        skill_content: '',
        iteration,
        max_iterations: MAX_ITERATIONS,
        api_url: API_URL,
        ws_url: WS_URL,
        pi_provider: PI_PROVIDER,
        pi_model: PI_MODEL,
        iteration_timeout_ms: ITERATION_TIMEOUT,
        forced_vote: this.forcedVoteRound,
        human_instructions: instructions,
      };
    }).map(task => {
      this.pendingInstructions.delete(task.profile_role);
      return task;
    });
  }

  private async processResults(results: any[], sessionId: string): Promise<boolean> {
    let waitCount = 0;

    for (const result of results) {
      if (!result) {
        waitCount += 1;
        continue;
      }

      console.log(`  🤖 ${result.agent_id}: ${result.action} - ${result.reasoning?.substring(0, 80) || ''}`);

      switch (result.action) {
        case 'opinion':
          await this.postOpinion(sessionId, result);
          break;
        case 'message':
          await this.postMessage(sessionId, result);
          break;
        case 'vote':
          await this.castVote(sessionId, result);
          break;
        case 'wait':
          waitCount += 1;
          console.log(`    ⏸️  ${result.agent_id} waiting: ${result.reasoning}`);
          break;
        case 'search':
          await this.performSearch(sessionId, result);
          break;
        default:
          waitCount += 1;
          break;
      }
    }

    return waitCount === results.length;
  }

  private async postOpinion(sessionId: string, result: any) {
    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}/opinions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: result.agent_id,
          content: result.content,
          confidence: result.confidence
        })
      });

      if (!response.ok) {
        console.error(`    ❌ Failed to post opinion: ${response.statusText}`);
        return;
      }

      console.log('    ✅ Opinion posted');
    } catch (error) {
      console.error('    ❌ Error posting opinion:', error);
    }
  }

  private async postMessage(sessionId: string, result: any) {
    try {
      const targetAgentId = this.agentIds.get(result.target_agent as AgentRole);
      if (!targetAgentId) {
        console.error(`    ❌ Unknown target profile: ${result.target_agent}`);
        return;
      }

      if (!result.content || result.content.trim().length === 0) {
        console.error('    ❌ Message content is empty, skipping');
        return;
      }

      const response = await fetch(`${API_URL}/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAgentId: result.agent_id,
          toAgentId: targetAgentId,
          content: result.content
        })
      });

      if (!response.ok) {
        console.error(`    ❌ Failed to post message: ${response.statusText}`);
        return;
      }

      console.log(`    ✅ Message sent to ${result.target_agent}`);
    } catch (error) {
      console.error('    ❌ Error posting message:', error);
    }
  }

  private async castVote(sessionId: string, result: any) {
    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: result.agent_id,
          verdict: result.verdict,
          rationale: result.reasoning || `Analysis iteration ${this.currentIteration}`
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`    ❌ Failed to cast vote: ${response.statusText} - ${errorBody}`);
        return;
      }

      this.votes.add(result.agent_id);
      console.log(`    ✅ Vote cast: ${result.verdict}`);
    } catch (error) {
      console.error('    ❌ Error casting vote:', error);
    }
  }

  private async performSearch(sessionId: string, result: any) {
    console.warn(`    ⚠️ Search action requested by ${result.agent_id}, but external research is disabled in this runtime.`);
    console.warn(`    ⚠️ Query: ${result.content || '(empty)'}`);
    console.warn(`    ⚠️ Session: ${sessionId}`);
  }

  private async closeSession(sessionId: string): Promise<void> {
    const response = await fetch(`${API_URL}/sessions/${sessionId}/votes`);
    if (!response.ok) {
      console.error(`❌ Failed to fetch votes before close: ${response.statusText}`);
      return;
    }

    const votes = await response.json() as SessionVote[];
    if (votes.length === 0) {
      console.log('⚠️  No votes cast, skipping session close');
      return;
    }

    const approveCount = votes.filter(v => v.verdict === 'approve').length;
    const rejectCount = votes.filter(v => v.verdict === 'reject').length;
    const verdict = approveCount > rejectCount ? 'approve' : 'reject';

    try {
      const closeResponse = await fetch(`${API_URL}/sessions/${sessionId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verdict,
          rationale: `Voting round completed with ${votes.length} votes. approve=${approveCount}, reject=${rejectCount}.`
        })
      });

      if (!closeResponse.ok) {
        throw new Error(`Failed to close session: ${closeResponse.statusText}`);
      }

      console.log(`✅ Session closed with verdict: ${verdict}`);
    } catch (error) {
      console.error('❌ Error closing session:', error);
    }
  }

  private handleOrchestratorCommand(event: OrchestratorCommandEvent): void {
    console.log(`\n🧭 Human command received: ${event.commandType} (by ${event.issuedBy})`);

    if (event.commandType === 'ask') {
      if (!event.targetAgentRole || !event.content) {
        console.log('⚠️  Ignoring ask command without target/content');
        return;
      }
      const current = this.pendingInstructions.get(event.targetAgentRole) ?? [];
      current.push(event.content);
      this.pendingInstructions.set(event.targetAgentRole, current);
      this.state = 'running';
      this.wakeLoop();
      return;
    }

    if (event.commandType === 'vote') {
      this.forcedVoteRound = true;
      for (const profile of AGENTS_CONFIG) {
        const role = profile.role as AgentRole;
        const current = this.pendingInstructions.get(role) ?? [];
        current.push('Human command: start voting round now. Vote if you have enough evidence.');
        this.pendingInstructions.set(role, current);
      }
      this.state = 'running';
      this.wakeLoop();
      return;
    }

    if (event.commandType === 'resume') {
      this.state = 'running';
      this.wakeLoop();
    }
  }

  private waitForCommand(): Promise<void> {
    return new Promise((resolve) => {
      this.wakeResolver = resolve;
    });
  }

  private wakeLoop(): void {
    if (this.wakeResolver) {
      const resolver = this.wakeResolver;
      this.wakeResolver = null;
      resolver();
    }
  }

  stop(): void {
    console.log('🛑 Stopping gateway...');
    this.running = false;
    this.state = 'stopped';
    this.wakeLoop();
    this.workerManager.stopAll();
    this.ws?.close();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  const sessionId = process.argv[2];

  if (!sessionId) {
    console.error('❌ Error: Missing session ID');
    console.error('Usage: node dist/index.js <session-id>');
    process.exit(1);
  }

  const orchestrator = new GatewayOrchestrator();

  process.on('SIGTERM', () => {
    console.log('👋 Received SIGTERM, shutting down gracefully...');
    orchestrator.stop();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('👋 Received SIGINT, shutting down gracefully...');
    orchestrator.stop();
    process.exit(0);
  });

  try {
    await orchestrator.start(sessionId);
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
