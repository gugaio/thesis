import type { Session, Hypothesis, Document, Agent, Opinion, Message, Vote } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || response.statusText);
    }

    return response.json();
  }

  async getSessions(): Promise<Session[]> {
    return this.request<Session[]>('/sessions');
  }

  async getSession(id: string): Promise<{ session: Session; hypothesis: Hypothesis; documents: Document[]; ledger: any[] }> {
    return this.request<{ session: Session; hypothesis: Hypothesis; documents: Document[]; ledger: any[] }>(`/sessions/${id}`);
  }

  async getSessionAgents(id: string): Promise<Agent[]> {
    return this.request<Agent[]>(`/sessions/${id}/agents`);
  }

  async getSessionVotes(id: string): Promise<Vote[]> {
    return this.request<Vote[]>(`/sessions/${id}/votes`);
  }

  async getSessionOpinions(id: string): Promise<Opinion[]> {
    return this.request<Opinion[]>(`/sessions/${id}/opinions`);
  }

  async getSessionMessages(id: string, agentId?: string): Promise<{ messages: Message[] }> {
    const query = agentId ? `?agentId=${agentId}` : '';
    return this.request<{ messages: Message[] }>(`/sessions/${id}/messages${query}`);
  }

  async getSessionReport(id: string): Promise<any> {
    return this.request<any>(`/sessions/${id}/report`);
  }

  async getDocumentContent(sessionId: string, docId: string): Promise<{ text: string; type: string }> {
    return this.request<{ text: string; type: string }>(`/sessions/${sessionId}/documents/${docId}/content`);
  }

  async downloadDocument(sessionId: string, docId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/documents/${docId}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || response.statusText);
    }

    return response.blob();
  }
}

export const apiClient = new APIClient(API_URL);
