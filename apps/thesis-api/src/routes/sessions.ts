import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { SessionCreatedEvent, EventType } from '@thesis/protocol';
import { randomUUID } from 'crypto';
import { SessionRepository } from '../repositories/session.repository.js';
import { HypothesisRepository } from '../repositories/hypothesis.repository.js';
import { DocumentRepository } from '../repositories/document.repository.js';
import { LedgerService } from '../services/ledger.service.js';
import { getPool } from '../db/connection.js';

interface InitSessionBody {
  hypothesisStatement: string;
  hypothesisDescription?: string;
}

export async function sessionRoutes(fastify: FastifyInstance): Promise<void> {
  const pool = getPool();
  const hypothesisRepo = new HypothesisRepository(pool);
  const sessionRepo = new SessionRepository(pool, hypothesisRepo);
  const documentRepo = new DocumentRepository(pool);
  const ledgerService = new LedgerService();

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

    return reply.status(201).send({
      sessionId: session.id,
      hypothesisId: session.hypothesis.id,
      status: session.status,
    });
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
}
