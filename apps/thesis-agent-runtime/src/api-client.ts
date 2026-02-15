import { log } from './config.js';

interface SessionResponse {
  session: {
    id: string;
    status: string;
    finalVerdict?: string;
    hypothesis: {
      id: string;
      statement: string;
      description: string;
      confidence: number;
    };
  };
  documents: Array<{
    id: string;
    name: string;
    type: string;
    uploadedAt: Date;
    contentHash: string;
  }>;
}

export class APIClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(baseUrl: string, timeout: number = 10000) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeout = timeout;
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<SessionResponse | null> {
    try {
      const url = `${this.baseUrl}/sessions/${sessionId}`;
      log.debug(`[APIClient] Fetching session: ${url}`);
      
      const response = await this.fetchWithTimeout(url);
      
      if (!response.ok) {
        log.warn(`[APIClient] Session fetch failed: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const data = await response.json() as SessionResponse;
      return data;
    } catch (error) {
      log.error(`[APIClient] Error fetching session:`, error);
      return null;
    }
  }

  async getDocuments(sessionId: string): Promise<Array<{
    id: string;
    name: string;
    type: string;
    contentHash: string;
  }>> {
    try {
      const url = `${this.baseUrl}/sessions/${sessionId}/documents`;
      log.debug(`[APIClient] Fetching documents: ${url}`);
      
      const response = await this.fetchWithTimeout(url);
      
      if (!response.ok) {
        log.warn(`[APIClient] Documents fetch failed: ${response.status} ${response.statusText}`);
        return [];
      }
      
      const documents = await response.json() as any[];
      return documents.map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        contentHash: doc.contentHash,
      }));
    } catch (error) {
      log.error(`[APIClient] Error fetching documents:`, error);
      return [];
    }
  }

  async getOpinions(sessionId: string): Promise<Array<{
    id: string;
    agentId: string;
    content: string;
    confidence: number;
    timestamp: Date;
  }>> {
    try {
      const url = `${this.baseUrl}/sessions/${sessionId}/opinions`;
      log.debug(`[APIClient] Fetching opinions: ${url}`);
      
      const response = await this.fetchWithTimeout(url);
      
      if (!response.ok) {
        log.warn(`[APIClient] Opinions fetch failed: ${response.status} ${response.statusText}`);
        return [];
      }
      
      const opinions = await response.json() as any[];
      return opinions;
    } catch (error) {
      log.error(`[APIClient] Error fetching opinions:`, error);
      return [];
    }
  }

  async getMessages(sessionId: string): Promise<Array<{
    id: string;
    sessionId: string;
    fromAgentId: string;
    toAgentId: string;
    content: string;
    sentAt: Date;
  }>> {
    try {
      const url = `${this.baseUrl}/sessions/${sessionId}/messages`;
      log.debug(`[APIClient] Fetching messages: ${url}`);
      
      const response = await this.fetchWithTimeout(url);
      
      if (!response.ok) {
        log.warn(`[APIClient] Messages fetch failed: ${response.status} ${response.statusText}`);
        return [];
      }
      
      const result = await response.json() as { messages: any[] };
      return result.messages || [];
    } catch (error) {
      log.error(`[APIClient] Error fetching messages:`, error);
      return [];
    }
  }

  async getVotes(sessionId: string): Promise<Array<{
    id: string;
    sessionId: string;
    agentId: string;
    verdict: string;
    rationale: string;
    votedAt: Date;
  }>> {
    try {
      const url = `${this.baseUrl}/sessions/${sessionId}/votes`;
      log.debug(`[APIClient] Fetching votes: ${url}`);
      
      const response = await this.fetchWithTimeout(url);
      
      if (!response.ok) {
        log.warn(`[APIClient] Votes fetch failed: ${response.status} ${response.statusText}`);
        return [];
      }
      
      const votes = await response.json() as any[];
      return votes;
    } catch (error) {
      log.error(`[APIClient] Error fetching votes:`, error);
      return [];
    }
  }

  async getAgents(sessionId: string): Promise<Array<{
    id: string;
    profile: {
      id: string;
      role: string;
      name: string;
    };
    joinedAt: Date;
    isActive: boolean;
  }>> {
    try {
      const url = `${this.baseUrl}/sessions/${sessionId}/agents`;
      log.debug(`[APIClient] Fetching agents: ${url}`);
      
      const response = await this.fetchWithTimeout(url);
      
      if (!response.ok) {
        log.warn(`[APIClient] Agents fetch failed: ${response.status} ${response.statusText}`);
        return [];
      }
      
      const agents = await response.json() as any[];
      return agents;
    } catch (error) {
      log.error(`[APIClient] Error fetching agents:`, error);
      return [];
    }
  }
}
