import { useEffect, useState, useRef } from 'react';
import type { WebSocketMessage, SessionData } from '@/types';

interface UseWebSocketOptions {
  sessionId: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export function useWebSocket({ sessionId, onConnect, onDisconnect, onError }: UseWebSocketOptions) {
  const [data, setData] = useState<SessionData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = () => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';
    const ws = new WebSocket(`${wsUrl}/ws/sessions/${sessionId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] WebSocket connected');
      setIsConnected(true);
      setError(null);
      onConnect?.();

      ws.send(JSON.stringify({ type: 'subscribe', sessionId }));
    };

    ws.onmessage = (event) => {
      console.log('[WS] Received message:', event.data);
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('[WS] Parsed message type:', message.type);

        if (message.type === 'initial') {
          setData({
            session: message.session!,
            hypothesis: message.hypothesis!,
            documents: message.documents!,
            agents: message.agents!,
            votes: message.votes!,
            opinions: message.opinions!,
            messages: message.messages!,
            ledger: message.ledger!,
            connectionCount: message.connectionCount!,
            clientId: message.clientId!,
          });
        } else if (message.type === 'event') {
          console.log('[WS] Processing event type:', message.data?.type);
          setData((prevData) => {
            if (!prevData) return prevData;

            const updatedData = { ...prevData };
            const event = message.data!;

            if (event.type === 'session.closed') {
              console.log('[WS] Processing session.closed event');
              updatedData.session.status = 'closed';
              updatedData.session.finalVerdict = event.finalVerdict;
              updatedData.session.closedAt = event.timestamp;
            }

            if (event.type === 'agent.joined' && !updatedData.agents.find(a => a.id === event.agentId)) {
              console.log('[WS] Processing agent.joined event');
              updatedData.agents.push({
                id: event.agentId,
                profile: {
                  id: event.agentProfileId,
                  name: event.agentRole,
                  role: event.agentRole,
                  description: '',
                  weight: 1,
                  soul: '',
                },
                joinedAt: event.timestamp,
                isActive: true,
                budget: {
                  credits: event.budgetCredits,
                  maxCredits: event.budgetCredits,
                  lastRefill: event.timestamp,
                },
              });
            }

            if (event.type === 'doc.uploaded' && !updatedData.documents.find(d => d.id === event.documentId)) {
              console.log('[WS] Processing doc.uploaded event', event);
              updatedData.documents.push({
                id: event.documentId,
                name: event.documentName,
                type: event.documentType,
                size: 0,
                uploadedAt: event.timestamp,
              });
              console.log('[WS] Documents after update:', updatedData.documents.length);
            }

            if (event.type === 'opinion.posted') {
              updatedData.opinions.push({
                id: event.opinionId,
                agentId: event.agentId,
                content: event.content,
                confidence: event.confidence,
                timestamp: event.timestamp,
              });
            }

            if (event.type === 'message.sent') {
              updatedData.messages.push({
                id: crypto.randomUUID(),
                fromAgentId: event.fromAgentId,
                toAgentId: event.toAgentId,
                content: event.content,
                sentAt: event.timestamp,
              });
            }

            if (event.type === 'vote.cast') {
              if (!updatedData.votes.find(v => v.agentId === event.agentId)) {
                updatedData.votes.push({
                  id: crypto.randomUUID(),
                  agentId: event.agentId,
                  verdict: event.verdict,
                  rationale: event.rationale,
                  votedAt: event.timestamp,
                });
              }
            }

            if (event.type === 'budget.updated') {
              const agent = updatedData.agents.find(a => a.id === event.agentId);
              if (agent) {
                agent.budget.credits = event.newCredits;
                agent.budget.lastRefill = event.timestamp;
              }
            }

            updatedData.ledger.push(event);
            console.log('[WS] Ledger after update:', updatedData.ledger.length);

            return updatedData;
          });
        } else if (message.type === 'error') {
          setError(message.message || 'Unknown error');
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('[WS] WebSocket error:', err);
      setError('WebSocket error');
      onError?.(err);
    };

    ws.onclose = () => {
      console.log('[WS] WebSocket disconnected');
      setIsConnected(false);
      onDisconnect?.();

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('[WS] Attempting to reconnect...');
        connect();
      }, 3000);
    };
  };

  useEffect(() => {
    if (sessionId) {
      connect();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [sessionId]);

  const send = (message: any) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return {
    data,
    isConnected,
    error,
    send,
  };
}
