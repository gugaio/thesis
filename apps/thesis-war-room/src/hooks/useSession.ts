import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import type { Session, Hypothesis, Document, Agent, Opinion, Message, Vote } from '@/types';

interface SessionData {
  session: Session;
  hypothesis: Hypothesis;
  documents: Document[];
  agents: Agent[];
  opinions: Opinion[];
  messages: Message[];
  votes: Vote[];
}

export function useSession(sessionId: string | null) {
  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSession = async () => {
    if (!sessionId) return;

    setLoading(true);
    setError(null);

    try {
      const [sessionData, agents, votes, opinions, messages] = await Promise.all([
        apiClient.getSession(sessionId),
        apiClient.getSessionAgents(sessionId),
        apiClient.getSessionVotes(sessionId),
        apiClient.getSessionOpinions(sessionId),
        apiClient.getSessionMessages(sessionId),
      ]);

      setData({
        session: sessionData.session,
        hypothesis: sessionData.hypothesis,
        documents: sessionData.documents,
        agents,
        opinions,
        messages: messages.messages,
        votes,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load session';
      setError(message);
      console.error('Error loading session:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  return {
    data,
    loading,
    error,
    reload: loadSession,
  };
}
