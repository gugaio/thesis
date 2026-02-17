import dotenv from 'dotenv';
import { WebSocket } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { AgentWorkerManager } from './worker-manager.js';
import { AGENTS_CONFIG, type AgentRole } from '@thesis/skills';
import { PerplexityClient } from '@thesis/tools';

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

class GatewayOrchestrator {
  private ws: WebSocket | null = null;
  private sessionData: SessionData | null = null;
  private running = false;
  private workerManager: AgentWorkerManager;
  private agentIds: Map<string, string> = new Map();
  private votes: Set<string> = new Set();
  private currentIteration = 0;
  private perplexityClient: PerplexityClient;

  constructor() {
    this.workerManager = new AgentWorkerManager(AGENTS_CONFIG.length);
    this.perplexityClient = new PerplexityClient();
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
    await this.runAnalysis(sessionId);
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
        const event = JSON.parse(data.toString());
        console.log(`📨 WebSocket event: ${event.type}`);
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
        this.agentIds.set(profile.role, result.agentId);
        console.log(`✅ Registered ${profile.name} (ID: ${result.agentId})`);
      } catch (error) {
        console.error(`❌ Error registering ${profile.role} agent:`, error);
        throw error;
      }
    }
  }

  private async runAnalysis(sessionId: string): Promise<void> {
    console.log('\n🏃 Running analysis for session:', sessionId);
    this.running = true;

    for (let i = 0; i < MAX_ITERATIONS && this.running && !this.shouldStop(); i++) {
      this.currentIteration = i + 1;
      console.log('***************************************************************************\n\n**********************************\n\n*********************')
      console.log(`\n🔄 Iteration ${this.currentIteration}/${MAX_ITERATIONS}`);

      const tasks = this.createAgentTasks(sessionId, this.currentIteration);

      console.log(`📋 Running ${tasks.length} agents in parallel...`);

      try {
        const results = await Promise.all(tasks.map(task => this.workerManager.runAgentTask(task)));
        await this.processResults(results, sessionId);
      } catch (error) {
        console.error('❌ Error running iteration:', error);
      }

      console.log(`\n📊 Stats:`, this.workerManager.getStats());

      if (this.shouldStop()) {
        console.log('\n🛑 Stopping conditions met');
        break;
      }

      await this.sleep(ITERATION_DELAY);
    }

    console.log('\n✅ Analysis completed');
    await this.closeSession(sessionId);
  }

  private createAgentTasks(sessionId: string, iteration: number) {
    return AGENTS_CONFIG.map(profile => ({
      session_id: sessionId,
      agent_id: this.agentIds.get(profile.role as AgentRole)!,
      profile_role: profile.role as AgentRole,
      skill_path: join(__dirname, '../../../packages/skills', profile.skillFile),
      skill_content: '',
      iteration,
      max_iterations: MAX_ITERATIONS,
      api_url: API_URL,
      ws_url: WS_URL,
      pi_provider: PI_PROVIDER,
      pi_model: PI_MODEL,
      iteration_timeout_ms: ITERATION_TIMEOUT,
    }));
  }

  private async processResults(results: any[], sessionId: string) {
    for (const result of results) {
      if (!result) continue;

      console.log(`  🤖 ${result.agent_id}: ${result.action} - ${result.reasoning?.substring(0, 50) || ''}...`);

      if (result.action === 'message') {
        const contentPreview = result.content ? result.content.substring(0, 100) : '(null)';
        const contentLength = result.content ? result.content.length : 0;
        console.log(`    📝 Content preview: ${contentPreview}`);
        console.log(`    📝 Content length: ${contentLength}`);
        console.log(`    🎯 Target: ${result.target_agent}`);
        console.log(`    🔍 Full result keys:`, Object.keys(result));
      }

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
          console.log(`    ⏸️  ${result.agent_id} waiting: ${result.reasoning}`);
          break;
        case 'search':
          await this.performSearch(sessionId, result);
          break;
      }
    }
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

      console.log(`    ✅ Opinion posted`);
    } catch (error) {
      console.error(`    ❌ Error posting opinion:`, error);
    }
  }

  private async postMessage(sessionId: string, result: any) {
    try {
      const targetAgentId = this.agentIds.get(result.target_agent);
      if (!targetAgentId) {
        console.error(`    ❌ Unknown target profile: ${result.target_agent}`);
        return;
      }

      console.log(`    📤 Posting message:`, JSON.stringify({
        fromAgentId: result.agent_id,
        toAgentId: targetAgentId,
        content: result.content?.substring(0, 50) || '(empty)'
      }));

      if (!result.content || result.content.trim().length === 0) {
        console.error(`    ❌ Message content is empty, skipping`);
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
        const errorBody = await response.text();
        console.error(`    ❌ Error body:`, errorBody);
        return;
      }

      console.log(`    ✅ Message sent to ${result.target_agent}`);
    } catch (error) {
      console.error(`    ❌ Error posting message:`, error);
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
        console.error(`    ❌ Failed to cast vote: ${response.statusText}`);
        return;
      }

      this.votes.add(result.agent_id);
      console.log(`    ✅ Vote cast: ${result.verdict}`);
    } catch (error) {
      console.error(`    ❌ Error casting vote:`, error);
    }
  }

  private async performSearch(sessionId: string, result: any) {
    console.log(`    🔍 Performing search for: ${result.content}`);
    try {
      const searchResult = await this.perplexityClient.research(result.content);

      console.log(`    ✅ Search completed (${searchResult.length} chars)`);

      // Create a new document with the search results
      const fileName = `search_result_${Date.now()}.md`;
      const fileContent = `# Search: ${result.content}\n\n**Agent**: ${result.agent_id}\n**Reasoning**: ${result.reasoning}\n\n---\n\n${searchResult}`;

      // We need to upload this content as a document.
      // Since API expects a file, we might need a new endpoint or form-data trickery.
      // For now, let's assume we can POST text directly to a new endpoint we'll create.

      const response = await fetch(`${API_URL}/sessions/${sessionId}/documents/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fileName,
          content: fileContent,
          type: 'text/markdown'
        })
      });

      if (!response.ok) {
        // Fallback if the endpoint doesn't exist yet (we are adding it next)
        console.warn(`    ⚠️ Failed to upload search result (Endpoint might be missing): ${response.statusText}`);
      } else {
        console.log(`    ✅ Search result saved as document: ${fileName}`);
      }

    } catch (error) {
      console.error(`    ❌ Error performing search:`, error);
    }
  }

  private shouldStop(): boolean {
    const allVoted = this.votes.size === AGENTS_CONFIG.length;
    const maxReached = this.currentIteration >= MAX_ITERATIONS;

    if (allVoted) {
      console.log('🏁 All agents have voted');
      return true;
    }

    if (maxReached) {
      console.log('🏁 Maximum iterations reached');
      return true;
    }

    return false;
  }

  private async closeSession(sessionId: string): Promise<void> {
    if (this.votes.size === 0) {
      console.log('⚠️  No votes cast, skipping session close');
      return;
    }

    console.log(`\n🏁 Closing session: ${sessionId}`);

    const votes = Array.from(this.votes);
    const approveCount = votes.length;

    const verdict = approveCount > votes.length / 2 ? 'approve' : 'reject';

    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verdict,
          rationale: `Analysis completed after ${this.currentIteration} iterations. ${votes.length} agents voted.`
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to close session: ${response.statusText}`);
      }

      console.log(`✅ Session closed with verdict: ${verdict}`);
    } catch (error) {
      console.error('❌ Error closing session:', error);
    }
  }

  stop(): void {
    console.log('🛑 Stopping gateway...');
    this.running = false;
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
