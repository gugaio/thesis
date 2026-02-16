import type { FastifyRequest } from 'fastify';
import type { WebSocket } from 'ws';
import type { SessionRepository } from '../repositories/session.repository.js';
import type { DocumentRepository } from '../repositories/document.repository.js';
import type { AgentRepository } from '../repositories/agent.repository.js';
import type { OpinionRepository } from '../repositories/opinion.repository.js';
import type { VoteRepository } from '../repositories/vote.repository.js';
import type { MessageRepository } from '../repositories/message.repository.js';
import type { LedgerService } from '../services/ledger.service.js';
import { broadcastService } from './broadcast.service.js';

interface WebSocketMessage {
  type: 'subscribe' | 'ping';
  sessionId?: string;
}

export function createWebSocketHandler(
  sessionRepo: SessionRepository,
  documentRepo: DocumentRepository,
  agentRepo: AgentRepository,
  opinionRepo: OpinionRepository,
  voteRepo: VoteRepository,
  messageRepo: MessageRepository,
  ledgerService: LedgerService
) {
  return async (
    socket: WebSocket,
    req: FastifyRequest<{ Params: { id: string } }>
  ) => {
    const { id: sessionId } = req.params;

    const session = await sessionRepo.findById(sessionId);
    if (!session) {
      socket.send(JSON.stringify({ type: 'error', message: 'Session not found' }));
      socket.close();
      return;
    }

    const clientId = broadcastService.addConnection(sessionId, socket);

    console.log(`WebSocket client connected: ${clientId} to session ${sessionId}`);

    const documents = await documentRepo.findBySessionId(sessionId);
    const agents = await agentRepo.findBySessionId(sessionId);
    const votes = await voteRepo.findBySessionId(sessionId);
    const opinions = await opinionRepo.findBySessionId(sessionId);
    const messages = await messageRepo.findBySessionId(sessionId);
    const ledger = await ledgerService.getEvents(sessionId);

    const initialState = {
      type: 'initial',
      sessionId,
      session: {
        id: session.id,
        status: session.status,
        finalVerdict: session.finalVerdict,
        closedAt: session.closedAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
      hypothesis: session.hypothesis,
      documents: documents.map((doc) => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        size: doc.size,
        uploadedAt: doc.uploadedAt,
      })),
      agents: agents.map((agent) => ({
        id: agent.id,
        profile: agent.profile,
        joinedAt: agent.joinedAt,
        isActive: agent.isActive,
        budget: agent.budget,
      })),
      votes: votes.map((vote) => ({
        id: vote.id,
        agentId: vote.agentId,
        verdict: vote.verdict,
        rationale: vote.rationale,
        votedAt: vote.votedAt,
      })),
      opinions: opinions.map((opinion) => ({
        id: opinion.id,
        agentId: opinion.agentId,
        content: opinion.content,
        confidence: opinion.confidence,
        timestamp: opinion.timestamp,
      })),
      messages: messages.map((msg) => ({
        id: msg.id,
        fromAgentId: msg.fromAgentId,
        toAgentId: msg.toAgentId,
        content: msg.content,
        sentAt: msg.sentAt,
        readAt: msg.readAt,
      })),
      ledger,
      connectionCount: broadcastService.getConnectionCount(sessionId),
      clientId,
    };

    socket.send(JSON.stringify(initialState));

    socket.on('message', (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());

        if (message.type === 'subscribe' && message.sessionId === sessionId) {
          socket.send(
            JSON.stringify({
              type: 'subscribed',
              sessionId,
              timestamp: new Date().toISOString(),
            })
          );
        } else if (message.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });

    socket.on('close', () => {
      console.log(`WebSocket client disconnected: ${clientId} from session ${sessionId}`);
    });

    socket.on('error', (error: Error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
    });
  };
}
