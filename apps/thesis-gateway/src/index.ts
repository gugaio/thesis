import dotenv from 'dotenv';
import { WebSocket } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:4000';
const WS_URL = process.env.WS_URL || 'ws://localhost:4000';
const MAX_CONCURRENT_AGENTS = parseInt(process.env.MAX_CONCURRENT_AGENTS || '3', 10);
const MAX_ITERATIONS = parseInt(process.env.MAX_ITERATIONS || '10', 10);
const ITERATION_TIMEOUT = parseInt(process.env.ITERATION_TIMEOUT || '30000', 10);

interface SessionData {
  id: string;
  hypothesis: string;
  status: string;
  agents: any[];
}

interface AgentProfile {
  id: string;
  role: string;
  name: string;
}

class GatewayOrchestrator {
  private ws: WebSocket | null = null;
  private sessionData: SessionData | null = null;
  private running = false;

  async start(sessionId: string): Promise<void> {
    console.log(`🚀 THESIS Gateway starting analysis for session: ${sessionId}`);

    this.sessionData = await this.fetchSession(sessionId);
    if (!this.sessionData) {
      throw new Error(`Session ${sessionId} not found`);
    }

    await this.connectWebSocket();
    await this.runAnalysis(sessionId);
  }

  async fetchSession(sessionId: string): Promise<SessionData | null> {
    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch session: ${response.statusText}`);
      }
      const session = await response.json() as SessionData;
      return session;
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

  private async runAnalysis(sessionId: string): Promise<void> {
    console.log(`🏃 Running analysis for session: ${sessionId}`);
    this.running = true;

    const profiles = this.getAgentProfiles();

    console.log(`📋 Creating ${profiles.length} agents: ${profiles.map(p => p.role).join(', ')}`);

    for (let i = 0; i < MAX_ITERATIONS && this.running; i++) {
      console.log(`\n🔄 Iteration ${i + 1}/${MAX_ITERATIONS}`);

      for (const profile of profiles) {
        if (!this.running) break;

        try {
          await this.runAgentIteration(sessionId, profile, i + 1);
        } catch (error) {
          console.error(`❌ Error running ${profile.role} agent:`, error);
        }
      }

      await this.sleep(2000);
    }

    console.log('\n✅ Analysis completed');
    await this.closeSession(sessionId);
  }

  private getAgentProfiles(): AgentProfile[] {
    return [
      { id: 'debt-agent-1', role: 'debt', name: 'Debt Specialist' },
      { id: 'tech-agent-1', role: 'tech', name: 'Tech Expert' },
      { id: 'market-agent-1', role: 'market', name: 'Market Analyst' }
    ];
  }

  private async runAgentIteration(
    sessionId: string,
    profile: AgentProfile,
    iteration: number
  ): Promise<void> {
    console.log(`  🤖 Running ${profile.role} agent (iteration ${iteration})`);

    const skillPath = join(dirname(__dirname), '../../packages/skills', `${profile.role === 'debt' ? 'debt-specialist' : profile.role === 'tech' ? 'tech-expert' : 'market-analyst'}/SKILL.md`);
    const skillContent = readFileSync(skillPath, 'utf-8');

    const action = this.decideAction(iteration);

    switch (action) {
      case 'opinion':
        await this.postOpinion(sessionId, profile, skillContent);
        break;
      case 'message':
        await this.postMessage(sessionId, profile, skillContent);
        break;
      case 'vote':
        await this.castVote(sessionId, profile, skillContent);
        break;
      default:
        console.log(`  ⏸️  ${profile.role} agent waiting`);
    }
  }

  private decideAction(iteration: number): 'opinion' | 'message' | 'vote' | 'wait' {
    if (iteration < 3) return 'opinion';
    if (iteration < 5) return 'message';
    if (iteration < 7) return 'opinion';
    if (iteration < MAX_ITERATIONS) return 'vote';
    return 'wait';
  }

  private async postOpinion(
    sessionId: string,
    profile: AgentProfile,
    skillContent: string
  ): Promise<void> {
    console.log(`    💭 Posting opinion from ${profile.role}`);

    const confidence = 0.7 + Math.random() * 0.2;
    const content = this.generateOpinionContent(profile, skillContent);

    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}/opinions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: profile.id,
          content,
          confidence
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to post opinion: ${response.statusText}`);
      }

      console.log(`    ✅ Opinion posted from ${profile.role}`);
    } catch (error) {
      console.error(`    ❌ Error posting opinion from ${profile.role}:`, error);
    }
  }

  private async postMessage(
    sessionId: string,
    profile: AgentProfile,
    skillContent: string
  ): Promise<void> {
    console.log(`    📨 Posting message from ${profile.role}`);

    const targetAgent = this.getRandomOtherAgent(profile.role);
    const content = `Question from ${profile.name} to ${targetAgent.name}: What are your thoughts on the current metrics?`;

    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_agent_id: profile.id,
          to_agent_id: targetAgent.id,
          content
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to post message: ${response.statusText}`);
      }

      console.log(`    ✅ Message posted from ${profile.role} to ${targetAgent.role}`);
    } catch (error) {
      console.error(`    ❌ Error posting message from ${profile.role}:`, error);
    }
  }

  private async castVote(
    sessionId: string,
    profile: AgentProfile,
    skillContent: string
  ): Promise<void> {
    console.log(`    🗳️  Casting vote from ${profile.role}`);

    const verdicts = ['approve', 'reject', 'abstain'];
    const verdict = verdicts[Math.floor(Math.random() * verdicts.length)] as 'approve' | 'reject' | 'abstain';
    const rationale = `Based on ${profile.name} analysis.`;

    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: profile.id,
          verdict,
          rationale
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to cast vote: ${response.statusText}`);
      }

      console.log(`    ✅ Vote cast from ${profile.role}: ${verdict}`);
    } catch (error) {
      console.error(`    ❌ Error casting vote from ${profile.role}:`, error);
    }
  }

  private generateOpinionContent(profile: AgentProfile, skillContent: string): string {
    const opinions = [
      `Based on my analysis as a ${profile.name}, I see several key metrics that warrant attention.`,
      `From a ${profile.name} perspective, this opportunity shows promise with some concerns.`,
      `My ${profile.name} analysis indicates moderate risk with potential upside.`
    ];
    return opinions[Math.floor(Math.random() * opinions.length)];
  }

  private getRandomOtherAgent(role: string): AgentProfile {
    const allProfiles = this.getAgentProfiles();
    const otherProfiles = allProfiles.filter(p => p.role !== role);
    return otherProfiles[Math.floor(Math.random() * otherProfiles.length)];
  }

  private async closeSession(sessionId: string): Promise<void> {
    console.log(`\n🏁 Closing session: ${sessionId}`);

    try {
      const response = await fetch(`${API_URL}/sessions/${sessionId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verdict: 'approve',
          rationale: 'Analysis completed by all agents'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to close session: ${response.statusText}`);
      }

      console.log('✅ Session closed successfully');
    } catch (error) {
      console.error('❌ Error closing session:', error);
    }
  }

  stop(): void {
    console.log('🛑 Stopping gateway...');
    this.running = false;
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
