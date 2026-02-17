import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { SessionCreatedEvent, SessionClosedEvent, EventType, VerdictType } from '@thesis/protocol';
import { randomUUID } from 'crypto';
import { SessionRepository } from '../repositories/session.repository.js';
import { HypothesisRepository } from '../repositories/hypothesis.repository.js';
import { DocumentRepository } from '../repositories/document.repository.js';
import { AgentRepository } from '../repositories/agent.repository.js';
import { VoteRepository } from '../repositories/vote.repository.js';
import { OpinionRepository } from '../repositories/opinion.repository.js';
import { AgentRankingRepository } from '../repositories/agent-ranking.repository.js';
import { LedgerRepository } from '../repositories/ledger.repository.js';
import { LedgerService } from '../services/ledger.service.js';
import { getPool } from '../db/connection.js';
import { publishEvent } from '../websocket/event-publisher.js';

interface InitSessionBody {
  hypothesisStatement: string;
  hypothesisDescription?: string;
}

interface CloseSessionBody {
  verdict: VerdictType;
  rationale?: string;
}

export async function sessionRoutes(fastify: FastifyInstance): Promise<void> {
  const pool = getPool();
  const hypothesisRepo = new HypothesisRepository(pool);
  const sessionRepo = new SessionRepository(pool, hypothesisRepo);
  const documentRepo = new DocumentRepository(pool);
  const agentRepo = new AgentRepository(pool);
  const voteRepo = new VoteRepository(pool);
  const opinionRepo = new OpinionRepository(pool);
  const rankingRepo = new AgentRankingRepository(pool);
  const ledgerRepo = new LedgerRepository(pool);
  const ledgerService = new LedgerService(ledgerRepo);

  fastify.post('/sessions', async (request: FastifyRequest<{ Body: InitSessionBody }>, reply) => {
    const { hypothesisStatement, hypothesisDescription } = request.body;

    if (!hypothesisStatement || hypothesisStatement.trim().length === 0) {
      return reply.status(400).send({ error: 'hypothesisStatement is required' });
    }

    const { session } = await sessionRepo.create({
      hypothesisStatement,
      hypothesisDescription,
    });

    const event: SessionCreatedEvent = {
      id: randomUUID(),
      type: 'session.created' as EventType.SESSION_CREATED,
      sessionId: session.id,
      timestamp: new Date(),
      version: 1,
      hypothesisId: session.hypothesis.id,
      hypothesisStatement: session.hypothesis.statement,
      createdBy: 'system',
    };

    await ledgerService.addEvent(session.id, event);

    publishEvent(session.id, event);

    return reply.status(201).send({
      sessionId: session.id,
      hypothesisId: session.hypothesis.id,
      status: session.status,
    });
  });

  fastify.get('/sessions', async (request, reply) => {
    const sessions = await sessionRepo.listAll();
    return reply.send(sessions);
  });

    fastify.get('/sessions/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const { id } = request.params;
      const session = await sessionRepo.findById(id);

      if (!session) {
        return reply.status(404).send({ error: 'Session not found' });
      }

      const documents = await documentRepo.findBySessionId(id);
      const events = await ledgerService.getEvents(id);

      return reply.send({
        session,
        hypothesis: session.hypothesis,
        documents,
        ledger: events,
      });
    });

  fastify.post(
    '/sessions/:id/close',
    async (request: FastifyRequest<{ Params: { id: string }; Body: CloseSessionBody }>, reply) => {
      const { id: sessionId } = request.params;
      const { verdict, rationale } = request.body;

      if (!verdict || verdict.trim().length === 0) {
        return reply.status(400).send({ error: 'verdict is required' });
      }

      if (!['approve', 'reject'].includes(verdict)) {
        return reply.status(400).send({ error: 'verdict must be approve or reject' });
      }

      try {
        const session = await sessionRepo.close({ sessionId, finalVerdict: verdict, rationale });

        const votes = await voteRepo.findBySessionId(sessionId);

        for (const vote of votes) {
          const votedCorrectly = vote.verdict === verdict;
          await rankingRepo.update({ agentId: vote.agentId, sessionId, votedCorrectly });
        }

        const event: SessionClosedEvent = {
          id: randomUUID(),
          type: 'session.closed' as EventType.SESSION_CLOSED,
          sessionId,
          timestamp: new Date(),
          version: 1,
          closedBy: 'system',
          finalVerdict: verdict,
        };

        await ledgerService.addEvent(sessionId, event);

        publishEvent(sessionId, event);

        return reply.send({
          sessionId: session.id,
          status: session.status,
          finalVerdict: session.finalVerdict,
          closedAt: session.closedAt,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (errorMessage.includes('already closed')) {
          return reply.status(409).send({ error: errorMessage });
        }
        if (errorMessage.includes('not found')) {
          return reply.status(404).send({ error: errorMessage });
        }

        return reply.status(500).send({ error: errorMessage });
      }
    }
  );

  fastify.get(
    '/sessions/:id/report',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const { id: sessionId } = request.params;

      const session = await sessionRepo.findById(sessionId);

      if (!session) {
        return reply.status(404).send({ error: 'Session not found' });
      }

      const documents = await documentRepo.findBySessionId(sessionId);
      const agents = await agentRepo.findBySessionId(sessionId);
      const votes = await voteRepo.findBySessionId(sessionId);
      const opinions = await opinionRepo.findBySessionId(sessionId);
      const rankings = await rankingRepo.listBySessionId(sessionId);
      const voteCounts = await voteRepo.countBySessionId(sessionId);

      const report = {
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
          postedAt: opinion.timestamp,
        })),
        voteCounts,
        rankings: rankings.map((ranking) => ({
          agentId: ranking.agentId,
          score: ranking.score,
          totalVotes: ranking.totalVotes,
          correctVotes: ranking.correctVotes,
          totalOpinions: ranking.totalOpinions,
          avgConfidence: ranking.avgConfidence,
        })),
        generatedAt: new Date(),
      };

      return reply.send(report);
    }
  );
}
