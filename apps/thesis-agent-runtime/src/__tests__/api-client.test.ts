import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { APIClient } from '../api-client.js';

describe('APIClient', () => {
  let apiClient: APIClient;
  let fetchMock: any;

  beforeEach(() => {
    apiClient = new APIClient('http://localhost:4000', 5000);
    fetchMock = vi.fn();
    global.fetch = fetchMock as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should remove trailing slash from baseUrl', () => {
      const client = new APIClient('http://localhost:4000/');
      expect(client).toBeDefined();
    });
  });

  describe('getSession', () => {
    it('should fetch session successfully', async () => {
      const mockResponse = {
        session: {
          id: 'session-1',
          status: 'active',
          hypothesis: {
            id: 'hyp-1',
            statement: 'Test hypothesis',
            description: 'Test description',
            confidence: 0.8
          }
        },
        documents: []
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await apiClient.getSession('session-1');

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/sessions/session-1',
        expect.objectContaining({
          signal: expect.any(AbortSignal)
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should return null on non-OK response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await apiClient.getSession('session-1');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await apiClient.getSession('session-1');

      expect(result).toBeNull();
    });

    it('should handle timeout', async () => {
      const client = new APIClient('http://localhost:4000', 100);

      fetchMock.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      );

      const result = await client.getSession('session-1');

      expect(result).toBeNull();
    });
  });

  describe('getDocuments', () => {
    it('should fetch documents successfully', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          name: 'test.pdf',
          type: 'application/pdf',
          contentHash: 'abc123'
        }
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDocuments
      });

      const result = await apiClient.getDocuments('session-1');

      expect(result).toEqual(mockDocuments);
    });

    it('should return empty array on error', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await apiClient.getDocuments('session-1');

      expect(result).toEqual([]);
    });
  });

  describe('getOpinions', () => {
    it('should fetch opinions successfully', async () => {
      const mockOpinions = [
        {
          id: 'opinion-1',
          agentId: 'agent-1',
          content: 'Test opinion',
          confidence: 0.8,
          timestamp: new Date()
        }
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpinions
      });

      const result = await apiClient.getOpinions('session-1');

      expect(result).toEqual(mockOpinions);
    });

    it('should return empty array on error', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await apiClient.getOpinions('session-1');

      expect(result).toEqual([]);
    });
  });

  describe('getMessages', () => {
    it('should fetch messages successfully', async () => {
      const mockResponse = {
        messages: [
          {
            id: 'msg-1',
            sessionId: 'session-1',
            fromAgentId: 'agent-1',
            toAgentId: 'agent-2',
            content: 'Test message',
            sentAt: new Date()
          }
        ]
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await apiClient.getMessages('session-1');

      expect(result).toEqual(mockResponse.messages);
    });

    it('should handle empty messages', async () => {
      const mockResponse = {
        messages: []
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await apiClient.getMessages('session-1');

      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await apiClient.getMessages('session-1');

      expect(result).toEqual([]);
    });
  });

  describe('getVotes', () => {
    it('should fetch votes successfully', async () => {
      const mockVotes = [
        {
          id: 'vote-1',
          sessionId: 'session-1',
          agentId: 'agent-1',
          verdict: 'approve',
          rationale: 'Good investment',
          votedAt: new Date()
        }
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVotes
      });

      const result = await apiClient.getVotes('session-1');

      expect(result).toEqual(mockVotes);
    });

    it('should return empty array on error', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await apiClient.getVotes('session-1');

      expect(result).toEqual([]);
    });
  });

  describe('getAgents', () => {
    it('should fetch agents successfully', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          profile: {
            id: 'profile-1',
            role: 'debt',
            name: 'Debt Specialist'
          },
          joinedAt: new Date(),
          isActive: true
        }
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAgents
      });

      const result = await apiClient.getAgents('session-1');

      expect(result).toEqual(mockAgents);
    });

    it('should return empty array on error', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await apiClient.getAgents('session-1');

      expect(result).toEqual([]);
    });
  });

  describe('fetchWithTimeout', () => {
    it('should abort request on timeout', async () => {
      const client = new APIClient('http://localhost:4000', 100);

      fetchMock.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      );

      const result = await client.getSession('session-1');

      expect(result).toBeNull();
    });

    it('should complete request before timeout', async () => {
      const client = new APIClient('http://localhost:4000', 500);

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          session: {
            id: 'session-1',
            status: 'active',
            hypothesis: {
              id: 'hyp-1',
              statement: 'Test',
              description: 'Test',
              confidence: 0.8
            }
          },
          documents: []
        })
      });

      const result = await client.getSession('session-1');

      expect(result).not.toBeNull();
    });
  });
});
