import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { Session, Document, Event, Agent, OpinionEntry } from '@thesis/protocol';

export class ApiClient {
  private client: AxiosInstance;

  constructor(baseUrl: string = 'http://localhost:4000') {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async createSession(hypothesisStatement: string, hypothesisDescription?: string): Promise<{
    sessionId: string;
    hypothesisId: string;
    status: string;
  }> {
    try {
      const response = await this.client.post('/sessions', {
        hypothesisStatement,
        hypothesisDescription,
      });
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      throw new Error(err.response?.data?.error || err.message);
    }
  }

  async getSession(id: string): Promise<{
    session: Session;
    hypothesis: Session['hypothesis'];
    documents: Document[];
    ledger: Event[];
  }> {
    try {
      const response = await this.client.get(`/sessions/${id}`);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      throw new Error(err.response?.data?.error || err.message);
    }
  }

  async uploadDocument(
    sessionId: string,
    filePath: string
  ): Promise<{ documentId: string; name: string; size: number }> {
    try {
      const FormData = (await import('form-data')).default;
      const fs = (await import('fs')).default;

      const form = new FormData();
      form.append('file', fs.createReadStream(filePath));

      const response = await this.client.post(`/sessions/${sessionId}/documents`, form, {
        headers: {
          ...form.getHeaders(),
        },
        maxBodyLength: 10 * 1024 * 1024,
      });

      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      throw new Error(err.response?.data?.error || err.message);
    }
  }

  async listDocuments(sessionId: string): Promise<Document[]> {
    try {
      const response = await this.client.get(`/sessions/${sessionId}/documents`);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      throw new Error(err.response?.data?.error || err.message);
    }
  }

  async joinSession(
    sessionId: string,
    profileRole: string,
    initialCredits?: number
  ): Promise<{ agentId: string; profile: Agent['profile']; sessionId: string; budget: Agent['budget'] }> {
    try {
      const response = await this.client.post(`/sessions/${sessionId}/agents`, {
        profileRole,
        initialCredits,
      });
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      throw new Error(err.response?.data?.error || err.message);
    }
  }

  async listAgents(sessionId: string): Promise<Agent[]> {
    try {
      const response = await this.client.get(`/sessions/${sessionId}/agents`);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      throw new Error(err.response?.data?.error || err.message);
    }
  }

  async getAgent(id: string): Promise<Agent> {
    try {
      const response = await this.client.get(`/agents/${id}`);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      throw new Error(err.response?.data?.error || err.message);
    }
  }

  async postOpinion(
    sessionId: string,
    agentId: string,
    content: string,
    confidence: number
  ): Promise<{ opinionId: string; agentId: string; content: string; confidence: number }> {
    try {
      const response = await this.client.post(`/sessions/${sessionId}/opinions`, {
        agentId,
        content,
        confidence,
      });
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      throw new Error(err.response?.data?.error || err.message);
    }
  }

  async listOpinions(sessionId: string): Promise<OpinionEntry[]> {
    try {
      const response = await this.client.get(`/sessions/${sessionId}/opinions`);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      throw new Error(err.response?.data?.error || err.message);
    }
  }

  async sendMessage(
    sessionId: string,
    fromAgentId: string,
    toAgentId: string,
    content: string
  ): Promise<{ messageId: string; remainingCredits: number }> {
    try {
      const response = await this.client.post(`/sessions/${sessionId}/messages`, {
        fromAgentId,
        toAgentId,
        content,
      });
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      throw new Error(err.response?.data?.error || err.message);
    }
  }

  async listMessages(sessionId: string, agentId?: string, unreadOnly?: boolean): Promise<{
    messages: Array<{
      id: string;
      fromAgentId: string;
      toAgentId: string;
      content: string;
      sentAt: string;
      readAt: string | null;
    }>;
  }> {
    try {
      const params: string[] = [];
      if (agentId) params.push(`agentId=${agentId}`);
      if (unreadOnly) params.push(`unreadOnly=true`);

      const url = `/sessions/${sessionId}/messages${params.length ? '?' + params.join('&') : ''}`;
      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      throw new Error(err.response?.data?.error || err.message);
    }
  }

  async markMessagesAsRead(agentId: string, messageIds: string[]): Promise<{ markedAsRead: number }> {
    try {
      const response = await this.client.post(`/agents/${agentId}/messages/read`, {
        messageIds,
      });
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      throw new Error(err.response?.data?.error || err.message);
    }
  }

  async markAllMessagesAsRead(agentId: string): Promise<{ markedAsRead: number }> {
    try {
      const response = await this.client.post(`/agents/${agentId}/messages/read-all`);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      throw new Error(err.response?.data?.error || err.message);
    }
  }
}
