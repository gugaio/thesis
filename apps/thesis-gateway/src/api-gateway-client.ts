import type { AgentRole } from '@thesis/skills';
import type { AgentInfo, SessionData, SessionVote } from './types.js';

export class ApiGatewayClient {
  constructor(private readonly apiUrl: string) {}

  async fetchSession(sessionId: string): Promise<SessionData | null> {
    const response = await fetch(`${this.apiUrl}/sessions/${sessionId}`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json() as any;
    return {
      id: data.session.id,
      status: data.session.status,
      hypothesis: data.hypothesis,
      finalVerdict: data.session.finalVerdict,
    };
  }

  async registerAgent(sessionId: string, profileRole: AgentRole): Promise<string> {
    const response = await fetch(`${this.apiUrl}/sessions/${sessionId}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileRole,
        initialCredits: 100
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to register ${profileRole} agent: ${response.statusText}`);
    }

    const result = await response.json() as AgentInfo;
    return result.agentId;
  }

  async postOpinion(sessionId: string, payload: { agentId: string; content: string; confidence: number }): Promise<Response> {
    return fetch(`${this.apiUrl}/sessions/${sessionId}/opinions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  async postMessage(sessionId: string, payload: { fromAgentId: string; toAgentId: string; content: string }): Promise<Response> {
    return fetch(`${this.apiUrl}/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  async castVote(sessionId: string, payload: { agentId: string; verdict: string; rationale: string }): Promise<Response> {
    return fetch(`${this.apiUrl}/sessions/${sessionId}/votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  async listVotes(sessionId: string): Promise<SessionVote[]> {
    const response = await fetch(`${this.apiUrl}/sessions/${sessionId}/votes`);
    if (!response.ok) {
      throw new Error(`Failed to fetch votes: ${response.statusText}`);
    }
    return await response.json() as SessionVote[];
  }

  async closeSession(sessionId: string, payload: { verdict: 'approve' | 'reject'; rationale: string }): Promise<Response> {
    return fetch(`${this.apiUrl}/sessions/${sessionId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }
}
